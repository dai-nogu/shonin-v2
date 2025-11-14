import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { getSubscriptionInfo } from '@/app/actions/subscription-info';
import { getPlanLimits } from '@/types/subscription';
import { validateOrigin } from '@/lib/csrf-protection';

interface GetFeedbackRequest {
  feedback_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
}

export async function POST(request: NextRequest) {
  try {
    // CSRF保護: Origin/Refererチェック
    if (!validateOrigin(request)) {
      console.warn('CSRF attempt detected: Invalid origin', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return NextResponse.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // プラン制限をチェック
    const subscriptionInfo = await getSubscriptionInfo();
    const planLimits = getPlanLimits(subscriptionInfo.subscriptionStatus);
    
    if (!planLimits.hasAIFeedback) {
      return NextResponse.json(
        { error: 'AI機能はStandardプラン以上でご利用いただけます' },
        { status: 403 }
      );
    }
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { feedback_type, period_start, period_end }: GetFeedbackRequest = await request.json();

    // 既存フィードバックを取得（復号化ビュー使用）
    const { data, error: fetchError } = await supabase
      .from('ai_feedback_decrypted')
      .select('content, period_start, period_end, feedback_type, created_at')
      .eq('feedback_type', feedback_type)
      .eq('period_start', period_start)
      .eq('period_end', period_end)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // データが見つからない場合
        return NextResponse.json({ feedback: null }, { status: 200 });
      }
      console.error('フィードバック取得エラー:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    return NextResponse.json({
      feedback: data.content,
      period_type: data.feedback_type,
      period_start: data.period_start,
      period_end: data.period_end,
      created_at: data.created_at,
      is_existing: true
    });

  } catch (error) {
    console.error('フィードバック取得エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
