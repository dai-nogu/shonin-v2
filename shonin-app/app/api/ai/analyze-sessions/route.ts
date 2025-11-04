import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { analyzeSessionData, type RawSessionData } from '@/lib/session-analyzer';
import { generatePrompts, type PromptGenerationConfig } from '@/lib/prompt-generator';

interface SessionData {
  id: string;
  activity_name: string;
  duration: number;
  session_date: string;
  mood?: number;
  achievements?: string;
  challenges?: string;
  notes?: string;
  location?: string;
  goal_id?: string;
  goal_title?: string;
  goal_description?: string;
  goal_deadline?: string;
  goal_target_duration?: number;
  goal_current_value?: number;
  goal_status?: string;
}

interface AnalysisRequest {
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  locale?: string;
}

import { getSubscriptionInfo } from '@/app/actions/subscription-info';
import { getPlanLimits } from '@/types/subscription';

export async function POST(request: NextRequest) {
  try {
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

    const { period_type, period_start, period_end, locale = 'ja' }: AnalysisRequest = await request.json();

    // セッションデータを取得（復号化ビューを使用）
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions_reflections_decrypted')
      .select(`
        id,
        duration,
        session_date,
        mood,
        achievements,
        challenges,
        notes,
        location,
        goal_id,
        activity_id,
        activities!inner(name),
        goals(
          id,
          title,
          description,
          deadline,
          target_duration,
          weekday_hours,
          weekend_hours,
          current_value,
          status
        )
      `)
      .gte('session_date', period_start)
      .lte('session_date', period_end)
      .eq('user_id', user.id)
      .order('session_date', { ascending: false });

    if (sessionsError) {
      console.error('セッション取得エラー:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        feedback: getNoDataMessage(locale, period_type),
        period_type,
        period_start,
        period_end
      });
    }

    // 過去のフィードバックを取得（復号化ビュー使用）
    const { data: pastFeedbacks } = await supabase
      .from('ai_feedback_decrypted')
      .select('content, period_start, period_end, feedback_type, created_at')
      .eq('feedback_type', period_type)
      .order('created_at', { ascending: false })
      .limit(3); // 過去3回分を参照

    // OpenAI APIでフィードバック生成（文字数超過時は再生成）
    const feedback = await generateAIFeedbackWithRetry(sessions, period_type, period_start, period_end, pastFeedbacks || [], locale);

    // フィードバックをデータベースに保存（暗号化）
    const { error: saveError } = await supabase
      .rpc('insert_encrypted_feedback', {
        p_feedback_type: period_type,
        p_content: feedback,
        p_period_start: period_start,
        p_period_end: period_end
      });

    if (saveError) {
      console.error('フィードバック保存エラー:', saveError);
      // 保存に失敗してもフィードバックは返す
    }

    return NextResponse.json({
      feedback,
      period_type,
      period_start,
      period_end,
      sessions_count: sessions.length
    });

  } catch (error) {
    console.error('AI分析エラー:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateAIFeedbackWithRetry(
  sessions: any[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  pastFeedbacks: any[] = [],
  locale: string = 'ja'
): Promise<string> {
  const maxRetries = 3;
  // 英語は日本語より文字数が多くなる傾向があるため、調整
  const maxChars = locale === 'en' 
    ? (periodType === 'weekly' ? 400 : 1100) 
    : (periodType === 'weekly' ? 200 : 550);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const feedback = await generateAIFeedback(sessions, periodType, periodStart, periodEnd, pastFeedbacks, attempt, locale);
      const charCount = feedback.length;
      
      console.log(`Attempt ${attempt}: Generated ${charCount} characters (max: ${maxChars})`);
      
      if (charCount <= maxChars) {
        return feedback;
      }
      
      if (attempt === maxRetries) {
        // 最後の試行で文字数超過の場合、強制的に調整
        console.log(`Max retries reached. Truncating to ${maxChars} characters.`);
        const truncated = feedback.substring(0, maxChars - 50);
        const sentenceEnders = locale === 'en' 
          ? ['.', '!', '?']
          : ['。', '！', '？'];
        const lastSentenceEnd = Math.max(
          ...sentenceEnders.map(ender => truncated.lastIndexOf(ender))
        );
        
        if (lastSentenceEnd > maxChars * 0.7) {
          return truncated.substring(0, lastSentenceEnd + 1);
        }
        return truncated;
      }
      
      console.log(`Attempt ${attempt} exceeded ${maxChars} characters (${charCount}). Retrying...`);
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate feedback within character limit after max retries');
}

// データなし時のメッセージを生成するヘルパー関数
// 新しい言語を追加する場合：このmessagesオブジェクトに言語コード（ko, zh等）を追加
function getNoDataMessage(locale: string, periodType: 'weekly' | 'monthly'): string {
  const messages = {
    ja: `${periodType === 'weekly' ? '先週' : '先月'}は記録されたデータがありませんでしたが、それでも大丈夫です。休息も大切な時間ですし、新たなスタートを切る準備期間だったのかもしれませんね。いつでもあなたのペースで始めてください。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
    en: `There were no recorded activities ${periodType === 'weekly' ? 'last week' : 'last month'}, but that's perfectly okay. Rest is also an important part of growth, and this might have been a preparation period for a fresh start. You can begin whenever you're ready, at your own pace. ${periodType === 'weekly' ? "Let's make this week count together." : "Let's make this month count together."}`
    // 新しい言語の例：
    // ko: `記録なしメッセージ（韓国語）`,
    // zh: `記録なしメッセージ（中国語）`
  };
  
  return (messages as any)[locale] || messages.ja;
}

// getSystemPrompt と getUserPrompt は lib/prompt-generator.ts に移動しました

async function generateAIFeedback(
  sessions: any[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  pastFeedbacks: any[] = [],
  attempt: number = 1,
  locale: string = 'ja'
): Promise<string> {
  try {
    // 【層①】ローデータを構造化データに変換
    const analyzedData = analyzeSessionData(
      sessions as RawSessionData[],
      periodType,
      periodStart,
      periodEnd
    );
    
    // 【層②】構造化データからプロンプトを生成
    const promptConfig: PromptGenerationConfig = {
      locale,
      attempt,
      pastFeedbacksCount: pastFeedbacks.length
    };
    
    const { systemPrompt, userPrompt, maxTokens } = generatePrompts(analyzedData, promptConfig);

    // OpenAI APIリクエスト

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('OpenAI API Rate limit reached. Using fallback message.');
        return getFallbackMessage('rate_limit', locale, periodType);
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || getFallbackMessage('default', locale, periodType);
    
    // レスポンスが途中で切れていないかチェック
    const sentenceEnders = locale === 'en' ? ['.', '!', '?'] : ['。', '！', '？'];
    const isComplete = sentenceEnders.some(ender => content.endsWith(ender));
    
    if (!isComplete && data.choices[0]?.finish_reason === 'length') {
      // トークン制限で切れた場合のフォールバック
      return getFallbackMessage('truncated', locale, periodType);
    }
    
    return content;

  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return getFallbackMessage('error', locale, periodType);
  }
}

// フォールバックメッセージを生成するヘルパー関数
// 新しい言語を追加する場合：messagesオブジェクトに言語コードと4種類のメッセージを追加
function getFallbackMessage(
  type: 'rate_limit' | 'default' | 'truncated' | 'error',
  locale: string,
  periodType: 'weekly' | 'monthly'
): string {
  const messages = {
    ja: {
      rate_limit: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。フィードバック生成に時間がかかっています。少し時間をおいて再度お試しください。あなたの努力は確実に記録されています。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
      default: `無理しなくて大丈夫です。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
      truncated: `${periodType === 'weekly' ? '先週' : '先月'}の活動を分析していたところ、詳細な分析が長くなってしまいました。あなたの努力の深さを物語っていますね。重要なポイントは、着実に成長されていることです。この調子で続けていけば、必ず目標に近づいていけると確信しています。`,
      error: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。今、フィードバックの準備に少し時間がかかっていますが、あなたの努力が確実に積み重なっているのは見ています。また後で確認してみてくださいね。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`
    },
    en: {
      rate_limit: `I've been watching your efforts ${periodType === 'weekly' ? 'last week' : 'last month'}. Feedback generation is taking some time. Please try again in a moment. Your efforts are definitely being recorded. ${periodType === 'weekly' ? "Let's keep moving forward this week." : "Let's keep moving forward this month."}`,
      default: `Take your time, no pressure. ${periodType === 'weekly' ? "Let's work together this week." : "Let's work together this month."}`,
      truncated: `While analyzing your ${periodType === 'weekly' ? 'last week' : 'last month'}'s activities, the detailed analysis got quite long, which speaks to the depth of your efforts. The key point is that you're making steady progress. If you keep going like this, I'm confident you'll reach your goals.`,
      error: `I've been watching your efforts ${periodType === 'weekly' ? 'last week' : 'last month'}. Feedback preparation is taking a bit of time right now, but I see your efforts accumulating steadily. Please check back later. ${periodType === 'weekly' ? "Let's work together this week." : "Let's work together this month."}`
    }
    // 新しい言語の例：
    // ko: {
    //   rate_limit: `レート制限メッセージ（韓国語）`,
    //   default: `デフォルトメッセージ（韓国語）`,
    //   truncated: `切り詰めメッセージ（韓国語）`,
    //   error: `エラーメッセージ（韓国語）`
    // }
  };
  
  // 対応する言語のメッセージを返す。なければ日本語をデフォルトとする
  const localeMessages = (messages as any)[locale] || messages.ja;
  return localeMessages[type];
} 