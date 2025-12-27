import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { safeError, safeWarn } from "@/lib/safe-logger";
import { validateOrigin } from "@/lib/csrf-protection";

export async function POST(request: NextRequest) {
  try {
    // CSRF保護: Origin/Refererチェック
    if (!validateOrigin(request)) {
      safeWarn('CSRF attempt detected: Invalid origin', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return NextResponse.json(
        { status: 'error', error: 'Invalid origin', redirectUrl: '' },
        { status: 403 }
      );
    }

    // Supabase セッションからユーザーを取得
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { status: 'error', error: '認証が必要です', redirectUrl: '' },
        { status: 401 }
      );
    }

    // FormDataからpriceIdを取得
    const formData = await request.formData();
    const priceId = formData.get('priceId') as string;

    if (!priceId) {
      return NextResponse.json(
        { status: 'error', error: 'プランIDが指定されていません', redirectUrl: '' },
        { status: 400 }
      );
    }

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
        safeError('Stripe顧客IDの保存に失敗', updateError);
      }

      customerId = customer.id;
    }

    // Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
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
      success_url: `${process.env.BASE_URL}/dashboard`,
      cancel_url: `${process.env.BASE_URL}/dashboard`,
    });

    if (!session.url) {
      throw new Error("決済ページの作成に失敗しました");
    }

    return NextResponse.json({
      status: "success",
      error: "",
      redirectUrl: session.url,
    });
  } catch (error) {
    safeError("Stripe Checkout Session Creation Error", error);
    return NextResponse.json(
      {
        status: "error",
        error: "決済処理中にエラーが発生しました",
        redirectUrl: "",
      },
      { status: 500 }
    );
  }
}

