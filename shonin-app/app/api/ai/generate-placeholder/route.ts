import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { validateOrigin } from '@/lib/csrf-protection';
import { safeWarn, safeError } from '@/lib/safe-logger';
import Anthropic from '@anthropic-ai/sdk';

interface GeneratePlaceholderRequest {
  activity_id: string;
  goal_id: string | null;
  locale?: string;
}

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

    const { 
      activity_id, 
      goal_id, 
      locale = 'ja' 
    }: GeneratePlaceholderRequest = await request.json();

    // 過去のセッション情報を取得（暗号化されたデータを復号化するビューを使用）
    let query = supabase
      .from('decrypted_session')
      .select(`
        id,
        duration,
        session_date,
        mood_score,
        mood_notes,
        notes,
        reflection_notes,
        activities!inner(name)
      `)
      .eq('user_id', user.id)
      .eq('activity_id', activity_id)
      .not('session_date', 'is', null) // 保存済みのセッションのみ
      .order('session_date', { ascending: false })
      .limit(5);

    // 目標IDが指定されている場合のみフィルタリング
    if (goal_id) {
      query = query.eq('goal_id', goal_id);
    }

    const { data: sessions, error: sessionsError } = await query;

    if (sessionsError) {
      safeError('セッション取得エラー', sessionsError);
      // エラー時はセッションなしとしてプレースホルダーを生成
      // アクティビティ名を取得
      const { data: activity } = await supabase
        .from('activities')
        .select('name')
        .eq('id', activity_id)
        .single<{ name: string }>();
      const placeholder = getDefaultPlaceholder(0, null, locale, activity?.name);
      return NextResponse.json({ placeholder });
    }

    // アクティビティ名を取得
    const { data: activity } = await supabase
      .from('activities')
      .select('name')
      .eq('id', activity_id)
      .single<{ name: string }>();

    // 目標名を取得（目標IDがある場合）
    let goalTitle: string | null = null;
    if (goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('title')
        .eq('id', goal_id)
        .single<{ title: string }>();
      goalTitle = goal?.title ?? null;
    }

    // ユーザー名を取得
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single<{ name: string }>();

    // プレースホルダーを生成
    const placeholder = await generatePlaceholder({
      sessions: sessions || [],
      activityName: activity?.name || (locale === 'ja' ? 'アクティビティ' : 'Activity'),
      goalTitle,
      userName: userData?.name || null,
      locale
    });

    return NextResponse.json({ placeholder });

  } catch (error) {
    safeError('プレースホルダー生成エラー', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface GeneratePlaceholderParams {
  sessions: any[];
  activityName: string;
  goalTitle: string | null;
  userName: string | null;
  locale: string;
}

async function generatePlaceholder({
  sessions,
  activityName,
  goalTitle,
  userName,
  locale
}: GeneratePlaceholderParams): Promise<string> {
  // セッション回数
  const sessionCount = sessions.length;

  // 初回の場合
  if (sessionCount === 0) {
    return locale === 'ja' 
      ? `最初の${activityName}、お疲れ様でした。いかがでしたか？`
      : `First ${activityName}, good work. How was it?`;
  }

  // 前回のセッション情報
  const lastSession = sessions[0];

  // === AI生成専用の軽量データオブジェクトを作成 ===
  // 数値データは削除し、文章生成に必要な素材だけに絞る
  const promptPayload: Record<string, any> = {
    // 基本情報
    isFirstTime: sessionCount === 0,
    activityName, // 「瞑想」について...と言及できる
    
    // ▼ 数値データは一切渡さない！
    // previousMood: ... (削除)
    // previousDuration: ... (削除)
    
    // ▼ テキスト情報のみを渡す
    // 直近のメモがあればそれを渡す（なければnull）
    lastNote: lastSession.notes || null,
    
    // 直近の気分メモがあれば渡す（なければnull）
    lastMoodNote: lastSession.mood_notes || null,
  };

  // Anthropic APIでプレースホルダーを生成
  try {

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = locale === 'ja' 
      ? `【役割】
ユーザーが「具体的な工夫」を言語化できるよう、短く、温かく問いかけてください。

【制約】
- **出力は40文字以内の日本語・一文のみ**
- 具体的な数値（時間・スコア）は禁止
- 比較表現（前回より〜）は禁止
- ポジティブで優しい口調

【生成の絶対ルール】
ユーザーに「自分のことを見てくれている」と感じさせるため、以下のテクニックを使ってください。

1. **キーワードのオウム返し**:
   前回のメモに「肩」「呼吸」「集中」などの具体的な単語（名詞）がある場合、**必ずその単語を文中に含めてください**。
   × 「調子はどうでしたか？」
   ○ 「**肩**の調子、今日は意識できましたか？」

2. **アクティビティ名の活用**:
   メモがない場合は、アクティビティ名（瞑想、ランニング等）を含めてください。
   × 「今日の取り組みはどうでしたか？」
   ○ 「今日の**瞑想**で、気づいたことはありますか？」

【Few-Shot Examples（このパターンを模倣してください）】
User Input (Activity: 瞑想, Note: なし):
Assistant Output: 今日の瞑想を通して、心の変化はありましたか？
（解説：単に聞くのではなく「心の変化」という言葉で深さを出す）

User Input (Activity: 学習, Note: 集中力が続かなかった):
Assistant Output: 集中力について、今日はご自身のペースを守れましたか？
（解説：「続かなかった」を否定せず「ペースを守る」と言い換えて寄り添う）

User Input (Activity: 筋トレ, Note: 背中の筋肉を意識した):
Assistant Output: 前回意識されていた背中の感覚、今日はどうでしたか？
（解説：「前回意識されていた〜」と枕詞をつけるだけで「見てる感」が出る）

User Input (Activity: 日記, Note: 嫌なことがあって落ち込んだ):
Assistant Output: 気持ちを書き出すことで、少し整理できましたか？
（解説：ネガティブな内容には、解決を迫らず「プロセス」に寄り添う）

User Input (Activity: {{activityName}}, Note: {{last_memo_content}}):
Assistant Output:`

      : `【Role】
Help users articulate their "specific efforts" with a short, warm prompt.

【Constraints】
- **Output: Single sentence in English, within 50 characters**
- NO specific numbers (time, scores)
- NO comparison phrases (longer than~, better than~)
- Positive and gentle tone

【Absolute Rules for Generation】
To make users feel "you are being witnessed," use these techniques:

1. **Keyword Mirroring**:
   If the previous note contains specific words (nouns) like "shoulders," "breathing," "focus," **you MUST include that word in your output**.
   × "How did it go?"
   ○ "How did your **shoulders** feel today?"

2. **Activity Name Utilization**:
   If no memo, include the activity name (meditation, running, etc.).
   × "How was your session?"
   ○ "What stood out in today's **meditation**?"

【Few-Shot Examples (follow this pattern)】
User Input (Activity: Meditation, Note: none):
Assistant Output: Did you notice any shifts in your mind today?
(Explanation: Not just asking, but using "shifts in mind" to add depth)

User Input (Activity: Study, Note: couldn't maintain focus):
Assistant Output: With focus, did you find your own pace today?
(Explanation: Reframe "couldn't maintain" into "find your pace" positively)

User Input (Activity: Workout, Note: focused on back muscles):
Assistant Output: How did that back awareness feel this time?
(Explanation: "that back awareness" shows you remember their focus)

User Input (Activity: Journal, Note: feeling down about something):
Assistant Output: Did writing help you process things a bit?
(Explanation: For negative content, focus on the process, not the problem)

User Input (Activity: {{activityName}}, Note: {{last_memo_content}}):
Assistant Output:`;

    // Few-Shot形式に合わせたユーザー入力
    // activityNameとlastMemoContentを含む形式で渡す
    const lastMemoContent = promptPayload.lastNote || promptPayload.lastMoodNote || null;
    const noteText = lastMemoContent || (locale === 'ja' ? 'なし' : 'none');
    
    const userPrompt = locale === 'ja'
      ? `Activity: ${activityName}, Note: ${noteText}`
      : `Activity: ${activityName}, Note: ${noteText}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
    });

    const content = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : '';

    // 生成されたテキストをクリーンアップ（改行や余分な句点を削除）
    const placeholder = content.trim().replace(/\n/g, '').replace(/。。+/g, '。');

    return placeholder || getDefaultPlaceholder(sessionCount, userName, locale, activityName);

  } catch (error) {
    safeError('Anthropic API エラー', error);
    return getDefaultPlaceholder(sessionCount, userName, locale, activityName);
  }
}

function getDefaultPlaceholder(sessionCount: number, userName: string | null, locale: string, activityName?: string): string {
  const namePrefix = userName ? (locale === 'ja' ? `${userName}さん、` : `${userName}, `) : '';
  
  if (locale === 'ja') {
    if (sessionCount === 0) {
      return activityName 
        ? `最初の${activityName}、お疲れ様でした。いかがでしたか？`
        : `${namePrefix}最初の記録です。今日の取り組みについて、何か思ったことはありましたか？`;
    } else if (sessionCount === 1) {
      return `${namePrefix}前回との違いなど、気づいたことはありますか？`;
    } else {
      return `${namePrefix}今日の発見を残しておきましょう。`;
    }
  } else {
    if (sessionCount === 0) {
      return activityName
        ? `First ${activityName}, good work. How was it?`
        : `${namePrefix}Your first focus on this activity. What did you feel about it today?`;
    } else if (sessionCount === 1) {
      return `${namePrefix}Notice any differences from last time?`;
    } else {
      return `${namePrefix}Let's capture today's insights.`;
    }
  }
}
