"use server"

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function getSubscriptionInfo() {
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      subscriptionStatus: 'free' as const,
      currentPeriodEnd: null,
    };
  }

  // usersテーブルからsubscription_statusを取得
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  // subscriptionテーブルから更新日とキャンセル情報を取得
  const { data: subscriptionData } = await supabase
    .from('subscription')
    .select('stripe_current_period_end, cancel_at_period_end, canceled_at')
    .eq('user_id', user.id)
    .single();

  // cancel_at_period_endがtrueの場合、キャンセル予定とみなす
  const isCancelScheduled = subscriptionData?.cancel_at_period_end || false;

  return {
    subscriptionStatus: (userData?.subscription_status || 'free') as 'free' | 'standard',
    currentPeriodEnd: subscriptionData?.stripe_current_period_end || null,
    cancelAtPeriodEnd: isCancelScheduled,
    canceledAt: subscriptionData?.canceled_at || null,
  };
}


