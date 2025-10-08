"use server"

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";

export async function createStripeSession(prevState: any, formData: FormData) {
  const priceId = formData.get("priceId") as string;

  // Supabase セッションからユーザーを取得
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      error: "認証が必要です",
      redirectUrl: "",
    };
  }

  try {
    // DBからユーザー情報を取得
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (dbError) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    let customerId = dbUser?.stripe_customer_id;

    // Stripe顧客IDがなければ作成
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      // DBにStripe顧客IDを保存
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);

      if (updateError) {
        console.error('Stripe顧客IDの保存に失敗:', updateError);
      }

      customerId = customer.id;
    }

    // Checkoutセッションを作成
    const origin = process.env.BASE_URL;
    const session = await stripe.checkout.sessions.create({
      customer: customerId, // 既存または新規作成した顧客ID
      client_reference_id: user.id, // webhookでユーザー特定用
      metadata: {
        supabase_user_id: user.id,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.BASE_URL}/dashboard?success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BASE_URL}/dashboard?canceled=true`,
      // automatic_tax: { enabled: true },
    });
    
    if (!session.url) {
      throw new Error("決済ページの作成に失敗しました");
    }
    return {
      status: "success",
      error: "",
      redirectUrl: session.url,
    };

    
  } catch (error) {
    console.error("Stripe Session Creation Error", error);
    return {
      status: "error",
      error: "決済処理中にエラーが発生しました",
      redirectUrl: "",
    };
  }
}
