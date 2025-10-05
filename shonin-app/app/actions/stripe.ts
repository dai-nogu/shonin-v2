"use server"

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/dist/server/api-utils";

export async function createStripeSession(prevState: any, formData: FormData) {
  const priceId = formData.get("priceId") as string;

  // Supabase セッションからユーザーを取得
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("ユーザーが見つかりません");
  }

  try {
    const origin = process.env.BASE_URL; // or headers().get('origin')
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email, // stripe顧客連携
      client_reference_id: user.id, // webhookでユーザー特定用
      metadata: {
        supabase_user_id: user.id, // 追加のユーザー情報
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
