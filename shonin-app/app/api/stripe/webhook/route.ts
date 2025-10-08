import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Supabase Admin Client (Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SERVICE_ROLE_KEY!
);

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

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session.client_reference_id || !session.subscription) {
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

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
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

// Checkout完了時の処理
async function handleCheckoutCompleted(
  userId: string,
  subscriptionId: string,
  customerId: string
) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = (subscription.items.data[0]?.price as any)?.id as string;
    const periodEnd = (subscription.items.data[0] as any)?.current_period_end as number;
    
    if (!periodEnd || isNaN(periodEnd)) {
      throw new Error('Invalid period end timestamp');
    }
    
    const periodEndDate = new Date(periodEnd * 1000);
    
    // Price IDからプランを判定
    let subscriptionStatus: 'free' | 'standard' = 'free';
    
    switch (priceId) {
      case 'price_1SELAcIaAOyL3ERQxdk24Xyu':
        subscriptionStatus = 'free';
        break;
      case 'price_1SELBSIaAOyL3ERQzh3nDxnr':
        subscriptionStatus = 'standard';
        break;
      default:
        subscriptionStatus = 'free';
    }
    
    // DBに保存
    const { error: subError } = await supabaseAdmin
      .from('subscription')
      .upsert(
        {
          user_id: userId,
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

    // usersテーブルのステータスを更新
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ subscription_status: subscriptionStatus })
      .eq('id', userId);
    
    if (userError) {
      console.error('Failed to update users table:', userError);
      throw userError;
    }
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

// サブスクリプション変更時の処理
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = (subscription.metadata as any)?.supabase_user_id as string;

  if (!userId) {
    console.error('No user_id in subscription metadata');
    return;
  }

  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: 'free' })
      .eq('id', userId);
  } else {
    const periodEnd = (subscription as any).current_period_end as number;
    await supabaseAdmin
      .from('subscription')
      .update({
        stripe_current_period_end: new Date(periodEnd * 1000).toISOString(),
      })
      .eq('user_id', userId);
  }
}

// Invoice支払い成功時の処理
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
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

  const periodEnd = (subscription as any).current_period_end as number;
  await supabaseAdmin
    .from('subscription')
    .update({
      stripe_current_period_end: new Date(periodEnd * 1000).toISOString(),
    })
    .eq('user_id', userId);

  await supabaseAdmin
    .from('users')
    .update({ subscription_status: 'standard' })
    .eq('id', userId);
}

// Invoice支払い失敗時の処理
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