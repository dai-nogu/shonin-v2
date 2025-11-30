import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getPlanTypeFromPriceId, type PlanType } from '@/types/subscription';
import { safeError, stripeLog } from '@/lib/safe-logger';

// ==========================================
// Stripeイベント処理
// ==========================================
// 
// 【イベント一覧と処理内容】
// 
// 1. checkout.session.completed
//    - トリガー: ユーザーがチェックアウトで支払い完了
//    - 処理: 
//      * subscriptionテーブルにサブスクリプション情報を保存/更新
//        - stripe_subscription_id: 新しいサブスクリプションID
//        - stripe_price_id: Standardプランのprice_id
//        - stripe_current_period_end: 次回更新日
//      * usersテーブルのsubscription_statusを'standard'に更新
// 
// 2. customer.subscription.updated
//    - トリガー: サブスクリプション更新時（プラン変更、更新日変更、ステータス変更、キャンセルなど）
//    - 処理:
//      * status='active'の場合:
//        - subscriptionテーブルを更新（stripe_price_id、stripe_current_period_end、cancel_at_period_end、canceled_at）
//        - cancel_at_period_end=false の場合のみ、usersテーブルのsubscription_statusを'standard'に更新
//        - cancel_at_period_end=true の場合、ステータスは'standard'のまま（期間終了まで有効）
//      * status≠'active'の場合:
//        - usersテーブルのsubscription_statusを'free'に更新
//        - subscriptionテーブルのcancel_at_period_endをfalseに設定
//      * 注: キャンセル時は即座にdeleteされず、期間終了まではactiveだがcancel_at_period_end=trueになる
// 
// 3. customer.subscription.deleted
//    - トリガー: サブスクリプションが完全にキャンセル/削除された時
//    - 処理:
//      * usersテーブルのsubscription_statusを'free'に更新
//      * subscriptionテーブルのStripe関連フィールドは履歴として保持
//        - stripe_customer_id: 保持（再購入時に同じ顧客として扱うため）
//        - stripe_subscription_id: 保持（キャンセルされたサブスクIDの記録）
//        - stripe_price_id: 保持（最後に使っていたプランの記録）
//        - stripe_current_period_end: 保持（最後の有効期限の記録）
//      * 履歴保持の目的: 再購入時の参照、チャーン分析、サポート対応
// 
// 4. invoice.payment_succeeded
//    - トリガー: 定期支払い成功時（月次更新など）
//    - 処理:
//      * subscriptionテーブルのstripe_current_period_endを更新
//      * usersテーブルのsubscription_statusを'standard'に更新
// 
// 5. invoice.payment_failed
//    - トリガー: 定期支払い失敗時
//    - 処理: エラーログを出力（将来的にメール通知などを追加予定）
// 
// ==========================================

// Supabase Admin Client (Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

// ランタイム指定（App RouterだとedgeになってStripe SDKが動かない可能性があるため）
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook failed' },
      { status: 400 }
    );
  }

  // TODO: 将来的な改善 - Webhook二重送信対策
  // stripe_event_logsテーブルを作成し、event.idを保存
  // 同じIDが来たらスキップすることでメール二重送信を防ぐ
  // 現時点では実装不要（Stripeは基本的に重複を避ける仕組みを持っているため）

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.client_reference_id || !session.subscription || !session.customer) {
          return NextResponse.json(
            { error: 'Session Error' },
            { status: 500 }
          );
        }
        
        await handleCheckoutCompleted(
          session.client_reference_id,
          session.subscription as string,
          session.customer as string
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ==========================================
// Checkout完了時の処理
// ==========================================
// トリガー: checkout.session.completed
// タイミング: ユーザーがチェックアウトで支払いを完了した直後
// 
// 処理内容:
// 1. Stripeからサブスクリプション情報を取得
// 2. subscriptionテーブルに保存/更新（upsert）
//    - stripe_subscription_id: 新しいサブスクリプションID
//    - stripe_price_id: Standardプランのprice_id
//    - stripe_current_period_end: 次回更新日
// 3. usersテーブルのsubscription_statusを'standard'に更新
// ==========================================
async function handleCheckoutCompleted(
  userId: string,
  subscriptionId: string,
  customerId: string
) {
  try {
    const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
    // Stripe APIの型定義の問題を回避するため、anyを使用
    const subscription = subscriptionResponse as any;
    
    // サブスクリプションにuser_idのmetadataを追加（今後のイベントで活用）
    // これにより、handleSubscriptionUpdate内でmetadataを追加する必要がなくなり、
    // 不要なイベント発火を防ぐ
    if (!subscription.metadata?.supabase_user_id) {
      await stripe.subscriptions.update(subscriptionId, {
        metadata: {
          supabase_user_id: userId,
        },
      });
      console.log('Added user_id to subscription metadata:', subscriptionId);
    }
    
    const priceId = subscription.items.data[0]?.price?.id as string;
    // 新しいStripe APIでは、current_period_endがitems.data[0]に移動
    const periodEnd = (subscription.current_period_end || subscription.items.data[0]?.current_period_end) as number;
    
    if (!periodEnd || isNaN(periodEnd)) {
      console.error('Invalid periodEnd:', periodEnd);
      throw new Error('Invalid period end timestamp');
    }
    
    const periodEndDate = new Date(periodEnd * 1000);
    
    // Price IDからプランタイプを判定
    const subscriptionStatus: PlanType = getPlanTypeFromPriceId(priceId) || 'free';
    
    if (!getPlanTypeFromPriceId(priceId)) {
      safeError('Unknown price_id in checkout', { priceId, defaulting: 'free' });
    }
    
    // DBに保存
    const { error: subError } = await supabaseAdmin
      .from('subscription')
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          stripe_current_period_end: periodEndDate.toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (subError) {
      console.error('Failed to save subscription:', subError);
      throw subError;
    }

    // usersテーブルのステータスとstripe_customer_idを更新
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: subscriptionStatus,
        stripe_customer_id: customerId,
      })
      .eq('id', userId);
    
    if (userError) {
      console.error('Failed to update users table:', userError);
      throw userError;
    }

    // アップグレードメールを送信（FreeからPremiumへ）
    try {
      // ユーザー情報を取得
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userData?.email) {
        const firstName = userData.name || userData.email.split('@')[0] || 'ユーザー';
        
        // プラン名のマッピング（将来的に拡張しやすい設計）
        const getPlanDisplayName = (status: string): string => {
          switch (status) {
            case 'standard':
              return 'Standard';
            case 'premium':
              return 'Premium'; // 将来の拡張用
            default:
              return 'Standard'; // デフォルトはStandard
          }
        };
        
        const planName = getPlanDisplayName(subscriptionStatus);

        stripeLog('アップグレードメールを送信します', { email: userData.email, plan: planName });

        await fetch(`${process.env.BASE_URL}/api/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            firstName: firstName,
            emailCategory: 'subscription',
            emailType: 'upgrade',
            planName: planName,
          }),
        });

        stripeLog('✓ アップグレードメールを送信しました');
      }
    } catch (emailError) {
      // メール送信エラーはログのみ（サブスクリプション処理は継続）
      safeError('アップグレードメール送信中にエラーが発生', emailError);
    }
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

// ==========================================
// サブスクリプション更新時の処理
// ==========================================
// トリガー: customer.subscription.updated
// タイミング: サブスクリプションが更新された時（プラン変更、更新日変更、ステータス変更、キャンセルなど）
// 
// 処理内容:
// 1. user_idを取得（metadataまたはcustomer_id経由）
// 2. subscription.statusとcancel_at_period_endをチェック
//    - status='active': 
//      * subscriptionテーブルを更新（stripe_price_id、stripe_current_period_end、cancel_at_period_end、canceled_at）
//      * cancel_at_period_end=false の場合のみ、usersテーブルのsubscription_statusを'standard'に更新
//      * cancel_at_period_end=true の場合、ステータスは'standard'のまま（期間終了まで有効）
//    - status≠'active': 
//      * usersテーブルのsubscription_statusを'free'に更新
//      * subscriptionテーブルのcancel_at_period_endをfalseに設定
// 
// 注: キャンセル時は即座にdeleteされず、期間終了まではactiveだがcancel_at_period_end=trueになる
// ==========================================
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    // Stripeから最新のサブスクリプション情報を取得（webhookのデータは不完全な場合がある）
    const subscriptionResponse = await stripe.subscriptions.retrieve(subscription.id);
    // Stripe APIの型定義の問題を回避するため、anyを使用
    const fullSubscription = subscriptionResponse as any;
    
    // metadataからuser_idを取得
    let userId = fullSubscription.metadata?.supabase_user_id as string;

    // metadataにない場合、customerからuser_idを取得
    if (!userId) {
      const customerId = typeof fullSubscription.customer === 'string' 
        ? fullSubscription.customer 
        : fullSubscription.customer.id;
      
      console.log('No user_id in metadata, searching by customer_id:', customerId);
      
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (userError || !userData) {
        console.error('Failed to find user by customer_id:', userError);
        return;
      }

      userId = userData.id;
      
      // 今後のために、サブスクリプションにmetadataを追加
      await stripe.subscriptions.update(fullSubscription.id, {
        metadata: {
          supabase_user_id: userId,
        },
      });
      console.log('Added metadata to subscription:', fullSubscription.id);
    }

    const priceId = fullSubscription.items.data[0]?.price.id;
    // 新しいStripe APIでは、current_period_endがitems.data[0]に移動
    const periodEnd = (fullSubscription.current_period_end || fullSubscription.items.data[0]?.current_period_end) as number | undefined;
    
    stripeLog('Subscription Update', {
      user_id: userId,
      priceId,
      status: fullSubscription.status,
      periodEnd,
      cancelAtPeriodEnd: fullSubscription.cancel_at_period_end,
      cancelAt: fullSubscription.cancel_at,
      canceledAt: fullSubscription.canceled_at,
    });
    
    // Price IDからプランタイプを判定
    const subscriptionStatus: PlanType = getPlanTypeFromPriceId(priceId) || 'free';
    
    if (!getPlanTypeFromPriceId(priceId)) {
      console.error('Unknown price_id in subscription update:', priceId, '- defaulting to free');
    } else {
      console.log('Subscription updated for plan:', subscriptionStatus);
    }
    
    // キャンセル予定かどうかをチェック（cancel_at_period_end または cancel_at が設定されている場合）
    const cancelAt = fullSubscription.cancel_at;
    const cancelAtPeriodEnd = fullSubscription.cancel_at_period_end || (cancelAt ? true : false);
    // canceled_atはキャンセル予定の場合はnull、実際にキャンセルされた時のみ設定
    const canceledAt = fullSubscription.canceled_at
      ? new Date((fullSubscription.canceled_at as number) * 1000).toISOString() 
      : null;
    console.log('Is cancel scheduled:', cancelAtPeriodEnd);
    
    // アクティブな場合はDBを更新
    if (fullSubscription.status === 'active') {
      // ⚠️ 重要: DB更新前にメールチェック用の値を取得
      let wasCancelScheduledBefore = false;
      if (cancelAtPeriodEnd) {
        const { data: currentSubData } = await supabaseAdmin
          .from('subscription')
          .select('cancel_at_period_end')
          .eq('user_id', userId)
          .single();
        wasCancelScheduledBefore = currentSubData?.cancel_at_period_end || false;
        console.log('DB更新前のcancel_at_period_end:', wasCancelScheduledBefore);
      }
      
      // subscriptionテーブルを更新
      const updateData: any = {
        stripe_price_id: priceId,
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: canceledAt,
      };
      
      // periodEndが有効な場合のみ追加
      if (periodEnd && !isNaN(periodEnd)) {
        updateData.stripe_current_period_end = new Date(periodEnd * 1000).toISOString();
      }
      
      await supabaseAdmin
        .from('subscription')
        .update(updateData)
        .eq('user_id', userId);
      
      // キャンセル予定でない場合のみusersテーブルのステータスを更新
      if (!cancelAtPeriodEnd) {
        await supabaseAdmin
          .from('users')
          .update({ subscription_status: subscriptionStatus })
          .eq('id', userId);
        
        // キャンセルを取り消した場合（cancel_at_period_end が true → false）
        // この情報はupdate前に取得する必要があるため、ここで再度取得
        // （既に最新のStripeデータでDBが更新されているため、updateDataのcancel_at_period_endはfalse）
        console.log('キャンセル取り消しをチェック中（updateDataのcancel_at_period_end:', updateData.cancel_at_period_end, '）');
      }

      if (cancelAtPeriodEnd) {
        console.log(`Subscription will be canceled at period end for user ${userId}. Status remains '${subscriptionStatus}' until ${periodEnd ? new Date(periodEnd * 1000).toISOString() : 'period end'}.`);
        
        // ダウングレード予定メールを送信（初回キャンセル時のみ）
        // ロジック:
        // 1. DB更新前のcancel_at_period_endを確認（既に取得済み）
        // 2. DB更新前がfalse && 現在true = キャンセルボタンを押した瞬間
        // 3. それ以外はスキップ（既にキャンセル予定として記録済み）
        try {
          // DB更新前がfalseで、現在trueの場合のみメール送信
          // これは「サブスクリプションをキャンセル」ボタンを押した瞬間
          if (!wasCancelScheduledBefore && cancelAtPeriodEnd) {
            const { data: userData } = await supabaseAdmin
              .from('users')
              .select('email, name')
              .eq('id', userId)
              .single();

            if (userData?.email && periodEnd) {
              const firstName = userData.name || userData.email.split('@')[0] || 'ユーザー';
              
              // プラン名のマッピング
              const getPlanDisplayName = (status: string): string => {
                switch (status) {
                  case 'standard':
                    return 'Standard';
                  case 'premium':
                    return 'Premium';
                  default:
                    return 'Standard';
                }
              };
              
              const currentPlanName = getPlanDisplayName(subscriptionStatus);
              const changeDate = new Date(periodEnd * 1000).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              console.log('✅ キャンセルが確定しました。ダウングレード予定メールを送信します:', userData.email, `変更日: ${changeDate}`);

              await fetch(`${process.env.BASE_URL}/api/send`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: userData.email,
                  firstName: firstName,
                  emailCategory: 'subscription',
                  emailType: 'downgrade_scheduled',
                  planName: 'Free',
                  currentPlanName: currentPlanName,
                  changeDate: changeDate,
                }),
              });

              console.log('✓ ダウングレード予定メールを送信しました');
            }
          } else if (wasCancelScheduledBefore) {
            console.log('既にキャンセル予定として記録済みのため、メール送信をスキップします');
          }
        } catch (emailError) {
          safeError('ダウングレード予定メール送信中にエラーが発生', emailError);
        }
      } else {
        console.log(`Subscription updated for user ${userId}: ${subscriptionStatus} (price: ${priceId})`);
      }
    } 
    // 非アクティブな場合は全てfreeに戻す
    else {
      // subscriptionテーブルを更新
      await supabaseAdmin
        .from('subscription')
        .update({
          cancel_at_period_end: false,
          canceled_at: canceledAt,
        })
        .eq('user_id', userId);
      
      // usersテーブルのステータスを更新
      await supabaseAdmin
        .from('users')
        .update({ subscription_status: 'free' })
        .eq('id', userId);
        
      console.log(`Subscription inactive for user ${userId}. Status set to 'free'.`);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionUpdate:', error);
  }
}

// ==========================================
// サブスクリプションキャンセル時の処理
// ==========================================
// トリガー: customer.subscription.deleted
// タイミング: サブスクリプションが完全にキャンセル/削除された時
// 
// 処理内容:
// 1. usersテーブルのsubscription_statusを'free'に更新
// 2. subscriptionテーブルのStripe関連フィールドは履歴として保持
//    - stripe_customer_id: 保持（再購入時に同じ顧客として扱うため）
//    - stripe_subscription_id: 保持（キャンセルされたサブスクIDの記録）
//    - stripe_price_id: 保持（最後に使っていたプランの記録）
//    - stripe_current_period_end: 保持（最後の有効期限の記録）
// 
// 注: 履歴保持の目的 → 再購入時の参照、チャーン分析、サポート対応に活用
// ==========================================
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // metadataからuser_idを取得
    let userId = (subscription.metadata as any)?.supabase_user_id as string;

    // metadataにない場合、customerからuser_idを取得
    if (!userId) {
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      
      console.log('No user_id in metadata, searching by customer_id:', customerId);
      
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (userError || !userData) {
        console.error('Failed to find user by customer_id:', userError);
        return;
      }

      userId = userData.id;
    }

    console.log('=== Subscription Deleted ===');
    console.log('User ID:', userId);
    console.log('Subscription ID:', subscription.id);
    
    // subscriptionテーブルのcancel_at_period_endをfalseに、canceled_atをStripeから届いた時刻に設定
    const canceledAt = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : new Date().toISOString();
    
    await supabaseAdmin
      .from('subscription')
      .update({
        cancel_at_period_end: false,
        canceled_at: canceledAt,
      })
      .eq('user_id', userId);
    
    // usersテーブルのsubscription_statusを'free'に更新
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: 'free' })
      .eq('id', userId);
      
    console.log(`Subscription deleted for user ${userId}. Status set to 'free'. cancel_at_period_end set to false.`);

    // ダウングレードメールを送信（PremiumからFreeへ）
    try {
      // ユーザー情報を取得
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', userId)
        .single();

      if (userData?.email) {
        const firstName = userData.name || userData.email.split('@')[0] || 'ユーザー';

        console.log('ダウングレードメールを送信します:', userData.email);

        await fetch(`${process.env.BASE_URL}/api/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userData.email,
            firstName: firstName,
            emailCategory: 'subscription',
            emailType: 'downgrade',
            planName: 'Free',
          }),
        });

        console.log('✓ ダウングレードメールを送信しました');
      }
    } catch (emailError) {
      // メール送信エラーはログのみ（サブスクリプション処理は継続）
      safeError('ダウングレードメール送信中にエラーが発生', emailError);
    }
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
  }
}

// ==========================================
// Invoice支払い成功時の処理
// ==========================================
// トリガー: invoice.payment_succeeded
// タイミング: 定期支払いが成功した時（月次更新など）
// 
// 処理内容:
// 1. subscriptionテーブルのstripe_current_period_endを更新
// 2. usersテーブルのsubscription_statusを'standard'に更新
// ==========================================
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | undefined;
  
  if (!subscriptionId) {
    return;
  }

  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
  // Stripe APIの型定義の問題を回避するため、anyを使用
  const subscription = subscriptionResponse as any;
  const userId = subscription.metadata?.supabase_user_id as string;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const subscriptionStatus: PlanType = getPlanTypeFromPriceId(priceId) || 'free';
  
  if (!getPlanTypeFromPriceId(priceId)) {
    console.error('Unknown price_id in invoice payment:', priceId);
  }

  // 新しいStripe APIでは、current_period_endがitems.data[0]に移動
  const periodEnd = (subscription.current_period_end || subscription.items.data[0]?.current_period_end) as number;
  await supabaseAdmin
    .from('subscription')
    .update({
      stripe_current_period_end: new Date(periodEnd * 1000).toISOString(),
    })
    .eq('user_id', userId);

  await supabaseAdmin
    .from('users')
    .update({ subscription_status: subscriptionStatus })
    .eq('id', userId);
}

// ==========================================
// Invoice支払い失敗時の処理
// ==========================================
// トリガー: invoice.payment_failed
// タイミング: 定期支払いが失敗した時
// 
// 処理内容:
// 1. エラーログを出力
// 2. 将来的な拡張: メール通知、支払いリトライなど
// ==========================================
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string | undefined;
  
  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = (subscription.metadata as any)?.supabase_user_id as string;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  console.error(`Invoice payment failed for user ${userId}, invoice: ${invoice.id}`);
  
  // TODO: ユーザーにメール通知を送る処理を追加
  // TODO: 支払いリトライのロジックを追加
}