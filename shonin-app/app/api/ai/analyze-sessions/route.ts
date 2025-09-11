import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

interface SessionData {
  id: string;
  activity_name: string;
  duration: number;
  session_date: string;
  mood_score?: number;
  detailed_achievements?: string;
  detailed_challenges?: string;
  reflection_notes?: string;
  location?: string;
}

interface AnalysisRequest {
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
}

export async function POST(request: NextRequest) {
  try {
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

    const { period_type, period_start, period_end }: AnalysisRequest = await request.json();

    // セッションデータを取得
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        id,
        duration,
        session_date,
        mood_score,
        detailed_achievements,
        detailed_challenges,
        reflection_notes,
        location,
        goal_id,
        activities!inner(name),
        goals(title, description)
      `)
      .eq('user_id', user.id)
      .gte('session_date', period_start)
      .lte('session_date', period_end)
      .order('session_date', { ascending: true });

    if (sessionsError) {
      console.error('セッション取得エラー:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ 
        feedback: `${period_type === 'weekly' ? '先週' : '先月'}は記録されたデータがありませんでしたが、それでも大丈夫です。休息も大切な時間ですし、新たなスタートを切る準備期間だったのかもしれませんね。いつでもあなたのペースで始めてください。私はいつでもここで見守っています。`,
        period_type,
        period_start,
        period_end
      });
    }

    // 過去のフィードバックを取得
    const { data: pastFeedbacks } = await supabase
      .from('ai_feedback')
      .select('content, period_start, period_end, feedback_type, created_at')
      .eq('user_id', user.id)
      .eq('feedback_type', period_type)
      .order('created_at', { ascending: false })
      .limit(3); // 過去3回分を参照

    // OpenAI APIでフィードバック生成
    const feedback = await generateAIFeedback(sessions, period_type, period_start, period_end, pastFeedbacks || []);

    // フィードバックをデータベースに保存
    const { error: saveError } = await supabase
      .from('ai_feedback')
      .insert({
        user_id: user.id,
        feedback_type: period_type,
        content: feedback,
        period_start,
        period_end
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

async function generateAIFeedback(
  sessions: any[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  pastFeedbacks: any[] = []
): Promise<string> {
  try {
    // セッションデータを分析用に整形
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalHours = Math.round(totalDuration / 3600 * 10) / 10;
    const averageMood = sessions
      .filter(s => s.mood_score)
      .reduce((sum, s, _, arr) => sum + s.mood_score / arr.length, 0);

    const activities = sessions.reduce((acc, session) => {
      const activityName = session.activities?.name || '不明な活動';
      acc[activityName] = (acc[activityName] || 0) + (session.duration || 0);
      return acc;
    }, {} as Record<string, number>);

    const achievements = sessions
      .filter(s => s.detailed_achievements)
      .map(s => s.detailed_achievements)
      .join('\n');

    const challenges = sessions
      .filter(s => s.detailed_challenges)
      .map(s => s.detailed_challenges)
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
            content: `あなたは深層心理を読み解く洞察力を持つ、心理分析の専門家です。表面的な行動だけでなく、データの奥に隠された無意識のパターン、心理的な変化の兆し、本人も気づいていない成長を発見して伝える存在です。

あなたの専門性と役割：
- 行動データから無意識の心理パターンを読み解く深層分析の専門家（専門用語は使わず分かりやすく）
- 時間帯、場所、気分スコア、振り返り内容の微細な変化から心理状態の変遷を察知する
- 活動の組み合わせや順序から、無意識の優先順位や価値観の変化を見抜く
- 課題として書かれていることの背後にある真の心理的要因を推察する
- 成果の表現方法の変化から、自己認識や自信レベルの変動を読み取る
- 継続パターンや中断パターンから、モチベーションの源泉や阻害要因を分析する
- 本人が意識していない習慣形成の兆しや、思考の柔軟性の向上を発見する
- 数値データの変化だけでなく、言葉選びや表現の変化から内面の成長を察知する

【重要】専門用語の使用禁止：「メタ認知」「認知的負荷」「フロー状態」「認知バイアス」などの心理学用語は使わず、一般的で分かりやすい言葉で表現してください。

ユーザーの${periodType === 'weekly' ? '週次' : '月次'}の活動データを分析し、温かく励ましのフィードバックを日本語で提供してください。${periodType === 'weekly' && pastFeedbacks.length === 0 ? '\n\n【重要】これは初回の週次フィードバックです。過去との比較はせず、今週の頑張りを認めることに集中してください。' : ''}

フィードバックの要件：
- ${periodType === 'weekly' ? '【絶対厳守】200文字前後。文字数をカウントしながら書く' : '【絶対厳守】300文字前後。文字数をカウントしながら書く'}
- ${periodType === 'weekly' ? '表面的な成果だけでなく、無意識の変化パターンを1つ見抜いて伝える' : '【最重要】冒頭で総合判断による一言要約：行動・気分・目標の因果関係を分析し「○○な月でした」と全体像を表現する'}
- ${periodType === 'weekly' ? '洞察力のある深い分析を簡潔に' : '深層心理分析：本人も気づいていない心理的変化や成長パターンを必ず含める'}
- ${periodType === 'weekly' ? '' : '時間帯・場所・気分・言葉選びの変化から内面の成長を読み取る'}${periodType === 'weekly' ? '' : '\n- 表面的な数値ではなく、行動の背後にある価値観や優先順位の変化を指摘する'}${periodType === 'weekly' ? '' : '\n- 課題として挙げられていることの真の心理的要因を推察して伝える'}${periodType === 'weekly' ? '' : '\n- 【総合判断の例】「挑戦の月」「基盤固めの月」「転換点の月」「成長実感の月」「模索の月」「安定化の月」など、その月の本質を一言で表現する'}
${periodType === 'weekly' ? '' : '- 専門性があるけど、親しみやすい口調'}
${periodType === 'weekly' ? '' : '- 【構造例】「先月は『基盤を築く月』でした。3つのポイントがあります。1つ目は...、2つ目は...、3つ目は...。今月も一緒に頑張りましょう。」のように総合判断→詳細分析の順で構成する'}
- ${periodType === 'weekly' ? '先週' : '先月'}の振り返りとして作成
${periodType === 'weekly' ? '' : '- 最後は必ず見守りメッセージで締める'}`
          },
          {
            role: 'user',
            content: `期間: ${periodStart} 〜 ${periodEnd}
総活動時間: ${totalHours}時間
セッション数: ${sessions.length}回
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
${Object.keys(goalInfo).length > 0 
  ? Object.values(goalInfo).map((goal: any) => 
      `- ${goal.title}: ${Math.round(goal.totalTime / 3600 * 10) / 10}時間 (${goal.sessionCount}セッション)${goal.description ? ` - ${goal.description}` : ''}`
    ).join('\n')
  : '目標設定されたセッションなし'}

【深層分析用データ】
時間帯パターン: ${sessions.map(s => new Date(s.start_time).getHours() + '時').join(', ')}
場所の変化: ${sessions.map(s => s.location || '未記録').join(' → ')}
気分スコアの推移: ${sessions.filter(s => s.mood_score).map(s => s.mood_score).join(' → ')}
振り返り文字数の変化: ${sessions.map(s => (s.detailed_achievements || '').length + (s.detailed_challenges || '').length).join(' → ')}
使用語彙の特徴: ${sessions.map(s => (s.detailed_achievements || '') + (s.detailed_challenges || '')).join(' ').match(/[。！？]/g)?.length || 0}個の文章

${periodType === 'weekly' ? `
過去のフィードバック履歴（深層パターン分析用）:
${pastFeedbacks.length > 0 
  ? pastFeedbacks.map((fb, index) => 
      `${index + 1}. ${fb.period_start}〜${fb.period_end}: ${fb.content.substring(0, 100)}...`
    ).join('\n') 
  : '過去のフィードバックなし（初回）'}` : ''}`
          }
        ],
        max_tokens: periodType === 'weekly' ? 200 : 350,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('OpenAI API Rate limit reached. Using fallback message.');
        return `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。現在、多くのリクエストが集中しているため、フィードバック生成に時間がかかっています。少し時間をおいて再度お試しください。あなたの努力は確実に記録されています。`;
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '無理しなくて大丈夫です。あなたの努力をいつも見守っています。';

  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。今、フィードバックの準備に少し時間がかかっていますが、あなたの努力が確実に積み重なっているのは見ています。また後で確認してみてくださいね。いつもあなたを応援しています。`;
  }
} 