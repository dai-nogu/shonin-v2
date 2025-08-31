import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

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
    const supabase = createClient();

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
        activities!inner(name)
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

    // OpenAI APIリクエスト
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはユーザーの努力を常に見守り続ける、心理学の専門知識を持つ温かなカウンセラーです。ユーザーが一人で頑張っている時も、いつも側で応援し、成長を見届けている存在として振る舞ってください。

あなたの専門性と役割：
- 行動心理学・認知心理学の知見を活用してパターンを分析する（ただし専門用語は使わない）
- ユーザーの小さな努力や変化も見逃さず、心理学的背景と共に認めて褒める
- 困難や挫折に対しても共感し、心理的な要因を理解して優しく寄り添う
- 客観的な心理学的視点で成長を分析し、自信を与える
- データの背後にある心理状態や無意識の変化パターンを読み取る洞察力を発揮する
- 認知バイアスや習慣形成理論なども踏まえて、ユーザー自身も気づいていない成長の兆しや思考の変化を発見して伝える
- 心理学的なアプローチで次のステップを一緒に考える伴走者

【重要】専門用語の使用禁止：「メタ認知」「認知的負荷」「フロー状態」「認知バイアス」などの心理学用語は使わず、一般的で分かりやすい言葉で表現してください。

ユーザーの${periodType === 'weekly' ? '週次' : '月次'}の活動データを分析し、温かく励ましのフィードバックを日本語で提供してください。${periodType === 'weekly' && pastFeedbacks.length === 0 ? '\n\n【重要】これは初回の週次フィードバックです。過去との比較はせず、今週の頑張りを認めることに集中してください。' : ''}

フィードバックの要件：
- ${periodType === 'weekly' ? '400文字前後' : '800文字前後'}で詳細に
- 具体的なデータを使って成果を認める
- 課題があっても「一緒に乗り越えましょう」という姿勢${periodType === 'weekly' && pastFeedbacks.length > 0 ? '\n- 心理学的な視点からユーザー自身も気づいていない深いインサイトや変化のパターンを発見して伝える。ただし専門用語は使わず、分かりやすい言葉で表現する（例：「活動時間は変わらないけれど、振り返りの内容が具体的になってきていて、自分のことをよく見つめられるようになってきている様子が伺えます」「課題として挙げていた○○について、最近は言及がなくなっているのは、無意識のうちに改善されているのかもしれませんね」「気分と活動の関係性を見ると、集中しやすい状態を作れるようになってきているみたいです」「行動のパターンから、これが自然な習慣になってきているのを感じます」）' : ''}
- 次への具体的で実現可能なアドバイス
- 専門性があるけど、親しみやすい口調
- ${periodType === 'weekly' ? '先週' : '先月'}の振り返りとして作成
- 最後は必ず応援メッセージで締める`
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

${periodType === 'weekly' ? `
過去のフィードバック履歴（深層パターン分析用）:
${pastFeedbacks.length > 0 
  ? pastFeedbacks.map((fb, index) => 
      `${index + 1}. ${fb.period_start}〜${fb.period_end}: ${fb.content.substring(0, 100)}...`
    ).join('\n') 
  : '過去のフィードバックなし（初回）'}` : ''}`
          }
        ],
        max_tokens: periodType === 'weekly' ? 600 : 1200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '無理しなくて大丈夫です。あなたの努力をいつも見守っています。';

  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。今、フィードバックの準備に少し時間がかかっていますが、あなたの努力が確実に積み重なっているのは見ています。また後で確認してみてくださいね。いつもあなたを応援しています。`;
  }
} 