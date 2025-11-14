import { stripe } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeError } from "@/lib/safe-logger";

export async function POST() {
  try {
    // Supabase セッションからユーザーを取得
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DBからユーザー情報を取得
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (dbError || !dbUser?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No stripe customer id" },
        { status: 400 }
      );
    }

    // カスタマーポータルセッションを作成
    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripe_customer_id,
      return_url: `${process.env.BASE_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    safeError("Error", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
