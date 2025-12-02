import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { analyzeSessionData, type RawSessionData } from '@/lib/session-analyzer';
import { generatePrompts, type PromptGenerationConfig } from '@/lib/prompt-generator';
import Anthropic from '@anthropic-ai/sdk';
import { validateOrigin } from '@/lib/csrf-protection';
import { safeWarn, safeError, safeLog } from '@/lib/safe-logger';

// ... (インターフェース定義は変更なし)
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
    // CSRF保護: Origin/Refererチェック
    if (!validateOrigin(request)) {
      safeWarn('CSRF attempt detected: Invalid origin', {
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
      safeError('セッション取得エラー', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      // データなし時のメッセージをJSON形式で返す（フロントエンドのパースエラーを防ぐため）
      const noDataMsg = getNoDataMessage(locale, period_type);
      const jsonFeedback = JSON.stringify({
        overview: noDataMsg,
        insight: "",
        closing: "",
        principle_application: null,
        principle_definition: null
      });

      return NextResponse.json({ 
        feedback: jsonFeedback,
        period_type,
        period_start,
        period_end
      });
    }

    // 過去のフィードバックを取得
    const { data: pastFeedbacks } = await supabase
      .from('ai_feedback_decrypted')
      .select('content, period_start, period_end, feedback_type, created_at')
      .eq('feedback_type', period_type)
      .order('created_at', { ascending: false })
      .limit(3);

    // AIフィードバック生成（JSONパース検証込み）
    const feedback = await generateAIFeedbackWithRetry(sessions, period_type, period_start, period_end, pastFeedbacks || [], locale);

    // フィードバックをデータベースに保存
    // feedback変数はここでは「JSON文字列」になっています
    const { error: saveError } = await supabase
      .rpc('insert_encrypted_feedback', {
        p_feedback_type: period_type,
        p_content: feedback,
        p_period_start: period_start,
        p_period_end: period_end
      });

    if (saveError) {
      safeError('フィードバック保存エラー', saveError);
    }

    return NextResponse.json({
      feedback,
      period_type,
      period_start,
      period_end,
      sessions_count: sessions.length
    });

  } catch (error) {
    safeError('AI分析エラー', error);
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
  // JSONモードの場合、構文のための文字数が増えるため上限を少し緩和
  const maxChars = locale === 'en' 
    ? (periodType === 'weekly' ? 800 : 1300) 
    : (periodType === 'weekly' ? 500 : 800);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const feedback = await generateAIFeedback(sessions, periodType, periodStart, periodEnd, pastFeedbacks, attempt, locale);
      const charCount = feedback.length;
      
      safeLog(`Attempt ${attempt}: Generated ${charCount} characters`);
      
      // JSONパースチェックが成功して返ってきているはずなので、文字数チェックのみ
      if (charCount <= maxChars) {
        return feedback;
      }
      
      if (attempt === maxRetries) {
        safeLog(`Max retries reached. Returning as is.`);
        return feedback;
      }
      
      safeLog(`Attempt ${attempt} exceeded ${maxChars} characters. Retrying...`);
      
    } catch (error) {
      safeError(`Attempt ${attempt} failed`, error);
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw new Error('Failed to generate feedback');
}

function getNoDataMessage(locale: string, periodType: 'weekly' | 'monthly'): string {
  const messages = {
    ja: `${periodType === 'weekly' ? '先週' : '先月'}は記録されたデータがありませんでしたが、それでも大丈夫です。休息も大切な時間ですし、新たなスタートを切る準備期間だったのかもしれませんね。いつでもあなたのペースで始めてください。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
    en: `There were no recorded activities ${periodType === 'weekly' ? 'last week' : 'last month'}, but that's perfectly okay. Rest is also an important part of growth, and this might have been a preparation period for a fresh start. You can begin whenever you're ready, at your own pace. ${periodType === 'weekly' ? "Let's make this week count together." : "Let's make this month count together."}`
  };
  return (messages as any)[locale] || messages.ja;
}

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
    const analyzedData = analyzeSessionData(
      sessions as RawSessionData[],
      periodType,
      periodStart,
      periodEnd
    );
    
    const promptConfig: PromptGenerationConfig = {
      locale,
      attempt,
      pastFeedbacksCount: pastFeedbacks.length
    };
    
    // プロンプト生成（この時点でシステムプロンプトがJSON出力を指示している想定）
    const { systemPrompt, userPrompt, maxTokens } = generatePrompts(analyzedData, promptConfig);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const model = periodType === 'weekly' 
      ? 'claude-sonnet-4-20250514'  // 週次: Claude Sonnet 4（高速・コスト効率）
      : 'claude-opus-4-20250514';   // 月次: Claude Opus 4（高品質）

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        },
        {
          role: 'assistant',
          content: '{' // JSONの開始括弧をプレフィルして、JSON出力を強制・誘導するテクニック
        }
      ],
    });

    // レスポンスの取得（プレフィルの '{' を補完して結合）
    let content = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : '';
    
    if (content) {
      content = '{' + content; // プレフィルした分を戻す
    } else {
      return JSON.stringify({ overview: getFallbackMessage('default', locale, periodType) });
    }

    // 生成されたテキストが正しいJSONか検証し、オブジェクトとしてパースできるか確認します
    try {
      const feedbackData = JSON.parse(content);
      
      // パース成功：正しいJSON文字列として返す（これをDBに保存する）
      return JSON.stringify(feedbackData);

    } catch (parseError) {
      safeWarn('JSON Parse failed', parseError);
      
      // パース失敗時（JSONの一部が欠けているなど）のフォールバック
      // エラーメッセージ自体をJSON形式にして返すことで、フロントエンドのクラッシュを防ぐ
      const fallbackJson = {
        overview: content, // 原文をそのままoverviewに入れる（なんとか読めるように）
        error: "format_error"
      };
      return JSON.stringify(fallbackJson);
    }

  } catch (error) {
    safeError('Claude API エラー', error);
    
    if (error instanceof Anthropic.APIError && error.status === 429) {
      const msg = getFallbackMessage('rate_limit', locale, periodType);
      return JSON.stringify({ overview: msg });
    }
    
    const msg = getFallbackMessage('error', locale, periodType);
    return JSON.stringify({ overview: msg });
  }
}

function getFallbackMessage(
  type: 'rate_limit' | 'default' | 'truncated' | 'error',
  locale: string,
  periodType: 'weekly' | 'monthly'
): string {
  const messages = {
    ja: {
      rate_limit: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。フィードバック生成に時間がかかっています。少し時間をおいて再度お試しください。`,
      default: `無理しなくて大丈夫です。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
      truncated: `${periodType === 'weekly' ? '先週' : '先月'}の分析中にエラーが発生しましたが、あなたの努力は記録されています。`,
      error: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。今、フィードバックの準備に少し時間がかかっています。`
    },
    en: {
      rate_limit: `Feedback generation is taking some time. Please try again later.`,
      default: `Take your time, no pressure.`,
      truncated: `An error occurred during analysis, but your efforts are recorded.`,
      error: `Feedback preparation is taking a bit of time right now.`
    }
  };
  
  const localeMessages = (messages as any)[locale] || messages.ja;
  return localeMessages[type];
}