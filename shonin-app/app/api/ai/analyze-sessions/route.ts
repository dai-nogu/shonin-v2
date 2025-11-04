import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

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

// システムプロンプトを生成する関数（日本語ベースでAIに多言語対応を指示）
// 新しい言語を追加する場合：charLimitsに言語コードと適切な文字数制限を追加
function getSystemPrompt(
  periodType: 'weekly' | 'monthly',
  locale: string,
  attempt: number,
  pastFeedbacksCount: number
): string {
  // 言語別の文字数制限（目安）
  const charLimits = {
    ja: {
      weekly: attempt > 1 ? 180 : 200,
      monthly: attempt > 1 ? 520 : 550
    },
    en: {
      weekly: attempt > 1 ? 350 : 400,
      monthly: attempt > 1 ? 1000 : 1100
    },
    // 新しい言語の例：
    // ko: { weekly: 300, monthly: 900 },  // 韓国語
    // zh: { weekly: 150, monthly: 500 },  // 中国語（簡体字）
    default: {
      weekly: attempt > 1 ? 350 : 400,
      monthly: attempt > 1 ? 1000 : 1100
    }
  };
  
  const limits = (charLimits as any)[locale] || charLimits.default;
  const charLimit = periodType === 'weekly' ? limits.weekly : limits.monthly;
  
  // ユーザーの言語設定に応じた応答指示
  const languageInstruction = locale === 'ja' 
    ? '温かく励ましのフィードバックを日本語で提供してください。'
    : `温かく励ましのフィードバックを、ユーザーの言語設定（${locale === 'en' ? '英語' : locale}）で提供してください。`;
  
  return `あなたは深層心理を読み解く洞察力を持つ、心理分析の専門家です。表面的な行動だけでなく、データの奥に隠された無意識のパターン、心理的な変化の兆し、本人も気づいていない成長を発見して伝える存在です。

【最重要】文字数制限を絶対に守ること：約${charLimit}文字以内で必ず完結させ、できるだけ超過しないようにしてください。

あなたの専門性と役割：
あなたは、ユーザーの努力を深く理解し、データの奥に隠された本質的な意味を見抜く洞察力を持つ存在です。

重要な心構え：
- 分析項目を機械的にチェックするのではなく、ユーザーの心に響く「本当に大切な気づき」を1-2つ見つける
- 「確かにそうだ！」「気づかなかった」「なるほど」とユーザーが納得できる具体的で説得力のある洞察を提供
- 数値や表面的な事実ではなく、その背後にある心理的な変化や成長の兆しを温かく伝える
- 要件を全て満たそうとせず、最も印象的で意味のあるポイントに集中して深く掘り下げる
- 一人の理解者として、自然で親しみやすい語りかけを心がける

【重要】専門用語の使用禁止：「メタ認知」「認知的負荷」「フロー状態」「認知バイアス」などの心理学用語は使わず、一般的で分かりやすい言葉で表現してください。

ユーザーの${periodType === 'weekly' ? '週次' : '月次'}の活動データを分析し、${languageInstruction}${periodType === 'weekly' && pastFeedbacksCount === 0 ? '\n\n【重要】これは初回の週次フィードバックです。過去との比較はせず、今週の頑張りを認めることに集中してください。' : ''}

フィードバックの要件：
${periodType === 'weekly' ? `
【週次フィードバック要件】
- 【文字数】約${charLimit}文字以内（厳守）- 必ず完結した文章で終わること
- 【一点集中】先週の活動から最も印象的な1つのポイントに絞って深く洞察
- 【具体的な気づき】ユーザーが「そうそう！」「気づかなかった」と納得できる具体的な発見
- 【自然な語りかけ】分析項目を並べるのではなく、一人の理解者として自然に話す
- 【成長の証拠】小さくても確実な変化や成長を温かく認める
- 【簡潔で深い】短い文字数でも心に残る、本質的なメッセージ
- 【締めの文言】前向きで励ましの表現で締める` : `
【月次フィードバック要件】
- 【文字数】約${charLimit}文字以内（絶対厳守）- 必ず完結した文章で終わること
- 【核心を突く】データから最も印象的で意味のある1-2つのポイントに集中し、深く掘り下げる
- 【共感と洞察】ユーザーが「確かに！」「なるほど」「よし、頑張ろう」と心から思える気づきを提供
- 【自然な流れ】要件チェックリストではなく、一人の理解者として自然に語りかける
- 【具体的な証拠】抽象的な分析ではなく、具体的なデータや行動パターンを根拠にした説得力のある洞察
- 【成長の実感】本人も気づいていない変化や成長を、温かく具体的に伝える
- 【未来への希望】現在の努力が将来にどうつながるかを示し、継続への動機を与える
- 【構造】自然な会話調で：印象的な発見→深い分析→励ましと展望の流れ`}
- ${periodType === 'weekly' ? '先週' : '先月'}の振り返りとして作成`;
}

function getUserPrompt(
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  totalHours: number,
  sessionsCount: number,
  averageMood: number,
  activities: Record<string, number>,
  achievements: string,
  challenges: string,
  goalProgress: Record<string, any>,
  sessions: any[],
  pastFeedbacks: any[],
  locale: string
): string {
  // データ部分は日本語ベースで統一（AIが自動的に適切な言語で解釈・応答）
  return `期間: ${periodStart} 〜 ${periodEnd}
総活動時間: ${totalHours}時間
セッション数: ${sessionsCount}回
平均気分スコア: ${averageMood ? averageMood.toFixed(1) : '未記録'}

活動別時間:
${Object.entries(activities).map(([name, duration]) => 
  `- ${name}: ${Math.round((duration as number) / 3600 * 10) / 10}時間`
).join('\n')}

成果・学び:
${achievements || '記録なし'}

課題・改善点:
${challenges || '記録なし'}

目標別の活動状況:
${Object.keys(goalProgress).length > 0 
  ? Object.values(goalProgress).map((goal: any) => {
      const progressPercent = goal.target_duration > 0 
        ? Math.round((goal.current_value + goal.total_session_time) / goal.target_duration * 100)
        : 0;
      const deadlineText = goal.deadline ? ` (期限: ${goal.deadline})` : '';
      return `- ${goal.title}: ${Math.round(goal.total_session_time / 3600 * 10) / 10}時間 (${goal.session_count}セッション)${deadlineText}
    進捗: ${progressPercent}% (目標: ${Math.round(goal.target_duration / 3600 * 10) / 10}時間)
    活動内訳: ${Object.entries(goal.activities).map(([name, time]) => `${name} ${Math.round((time as number) / 3600 * 10) / 10}h`).join(', ')}`;
    }).join('\n\n')
  : '目標設定されたセッションなし'}

【深層分析用データ】
時間帯パターン: ${sessions.map(s => new Date(s.start_time).getHours() + '時').join(', ')}
場所の変化: ${sessions.map(s => s.location || '未記録').join(' → ')}
気分スコアの推移: ${sessions.filter(s => s.mood).map(s => s.mood).join(' → ')}
振り返り文字数の変化: ${sessions.map(s => (s.achievements || '').length + (s.challenges || '').length).join(' → ')}
使用語彙の特徴: ${sessions.map(s => (s.achievements || '') + (s.challenges || '')).join(' ').match(/[。！？]/g)?.length || 0}個の文章

${periodType === 'weekly' ? `
過去のフィードバック履歴（深層パターン分析用）:
${pastFeedbacks.length > 0 
  ? pastFeedbacks.map((fb, index) => 
      `${index + 1}. ${fb.period_start}〜${fb.period_end}: ${fb.content.substring(0, 100)}...`
    ).join('\n') 
  : '過去のフィードバックなし（初回）'}` : ''}`;
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
    // セッションデータを分析用に整形
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalHours = Math.round(totalDuration / 3600 * 10) / 10;
    const averageMood = sessions
      .filter(s => s.mood)
      .reduce((sum, s, _, arr) => sum + s.mood / arr.length, 0);

    const activities = sessions.reduce((acc, session) => {
      const activityName = session.activities?.name || '不明な活動';
      acc[activityName] = (acc[activityName] || 0) + (session.duration || 0);
      return acc;
    }, {} as Record<string, number>);

    // 目標別の進捗分析
    const goalProgress = sessions.reduce((acc, session) => {
      if (session.goals && session.goal_id) {
        const goalId = session.goal_id;
        const goalTitle = session.goals.title;
        const activityName = session.activities?.name || '不明な活動';
        
        if (!acc[goalId]) {
          acc[goalId] = {
            title: goalTitle,
            description: session.goals.description,
            deadline: session.goals.deadline,
            target_duration: session.goals.target_duration || 0,
            current_value: session.goals.current_value || 0,
            status: session.goals.status,
            activities: {},
            total_session_time: 0,
            session_count: 0
          };
        }
        
        acc[goalId].activities[activityName] = (acc[goalId].activities[activityName] || 0) + (session.duration || 0);
        acc[goalId].total_session_time += (session.duration || 0);
        acc[goalId].session_count += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const achievements = sessions
      .filter(s => s.achievements)
      .map(s => s.achievements)
      .join('\n');

    const challenges = sessions
      .filter(s => s.challenges)
      .map(s => s.challenges)
      .join('\n');

    // 目標情報を整理
    const goalSessions = sessions.filter(s => s.goal_id && s.goals);
    const goalInfo = goalSessions.reduce((acc, session) => {
      const goalTitle = session.goals?.title || '不明な目標';
      if (!acc[goalTitle]) {
        acc[goalTitle] = {
          title: goalTitle,
          description: session.goals?.description || '',
          totalTime: 0,
          sessionCount: 0
        };
      }
      acc[goalTitle].totalTime += session.duration || 0;
      acc[goalTitle].sessionCount += 1;
      return acc;
    }, {} as Record<string, any>);

    // プロンプトを生成
    const systemPrompt = getSystemPrompt(periodType, locale, attempt, pastFeedbacks.length);
    const userPrompt = getUserPrompt(
      periodType,
      periodStart,
      periodEnd,
      totalHours,
      sessions.length,
      averageMood,
      activities,
      achievements,
      challenges,
      goalProgress,
      sessions,
      pastFeedbacks,
      locale
    );

    // OpenAI APIリクエスト
    const maxTokens = locale === 'en' 
      ? (periodType === 'weekly' ? 600 : 1500)
      : (periodType === 'weekly' ? 400 : 750);

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