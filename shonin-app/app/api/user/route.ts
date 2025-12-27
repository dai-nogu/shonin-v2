import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeError } from "@/lib/safe-logger";

export async function GET() {
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

    if (dbError) {
      safeError("Error fetching user data", dbError);
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 });
    }

    return NextResponse.json({
      stripe_customer_id: dbUser?.stripe_customer_id || null,
    });
  } catch (error) {
    safeError("Error in user API", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

