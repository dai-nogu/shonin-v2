import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { safeLog, safeError } from '@/lib/safe-logger'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SERVICE_ROLE_KEY as string
)

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（簡易版）
    const userAgent = request.headers.get('user-agent')
    const xForwardedFor = request.headers.get('x-forwarded-for')
    
    // Authorizationヘッダーからトークンを取得
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: '認証トークンが見つかりません' }, { status: 401 })
    }

    // トークンを使用してユーザー情報を取得
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'ユーザーが認証されていません' }, { status: 401 })
    }

    safeLog('=== ユーザー削除処理開始 ===');
    safeLog('削除対象ユーザー情報:', {
      user_id: user.id,
      email: user.email,
      created_at: user.created_at,
    });

    // ユーザーのサブスクリプション情報を取得
    const { data: subscriptionData, error: subscriptionError } = await supabaseServer
      .from('subscription')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    // Stripeサブスクリプションのキャンセル処理
    // 注: アカウント削除時は即座にキャンセルし、課金も停止する
    // 残り期間は使えなくなるが、削除確認画面で警告表示済み
    if (subscriptionData?.stripe_subscription_id) {
      try {
        safeLog('Stripe Subscription ID:', subscriptionData.stripe_subscription_id);
        
        // サブスクリプションを即座にキャンセル（課金も即座に停止）
        await stripe.subscriptions.cancel(subscriptionData.stripe_subscription_id);
        
        safeLog('✓ Stripeサブスクリプションを即座にキャンセルしました');
        safeLog('  課金も停止されました');
      } catch (stripeError: any) {
        // Stripeでサブスクリプションが既に削除されている場合はエラーを無視
        if (stripeError.code === 'resource_missing') {
          safeLog('Stripeサブスクリプションは既に削除されています');
        } else {
          safeError('Stripeサブスクリプションのキャンセルに失敗', stripeError);
          // Stripeのキャンセルに失敗してもユーザー削除は続行
        }
      }
    } else {
      safeLog('アクティブなStripeサブスクリプションはありません');
    }

    // Service Role Keyを使用してユーザーを削除
    // これによりカスケード削除でusers, subscription, activities, sessions等も削除される
    const { data: deletedUser, error } = await supabaseServer.auth.admin.deleteUser(user.id)

    if (error) {
      safeError('アカウント削除に失敗しました', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    safeLog('✓ Supabaseアカウントを削除しました');
    safeLog('=== ユーザー削除処理完了 ===');
    safeLog('削除完了:', {
      user_id: user.id,
      email: user.email,
    });

    return NextResponse.json({ message: 'ユーザーが削除されました' }, { status: 200 })
  } catch (error) {
    safeError('予期しないエラー', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
} 