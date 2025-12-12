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
  current_mood?: number;
  current_duration?: number; // 秒単位
  is_pre_generation?: boolean; // true: 開始時の7割生成, false: 終了時の残り3割で完成
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
      current_mood,
      current_duration,
      is_pre_generation = false,
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
      const placeholder = getDefaultPlaceholder(0, null, locale);
      return NextResponse.json({ placeholder });
    }

    // アクティビティ名を取得
    const { data: activity } = await supabase
      .from('activities')
      .select('name')
      .eq('id', activity_id)
      .single();

    // 目標名を取得（目標IDがある場合）
    let goalTitle = null;
    if (goal_id) {
      const { data: goal } = await supabase
        .from('goals')
        .select('title')
        .eq('id', goal_id)
        .single();
      goalTitle = goal?.title;
    }

    // ユーザー名を取得
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    // プレースホルダーを生成
    const placeholder = await generatePlaceholder({
      sessions: sessions || [],
      activityName: activity?.name || (locale === 'ja' ? 'アクティビティ' : 'Activity'),
      goalTitle,
      userName: userData?.name || null,
      currentMood: current_mood,
      currentDuration: current_duration,
      isPreGeneration: is_pre_generation,
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
  currentMood?: number;
  currentDuration?: number;
  isPreGeneration: boolean; // true: 7割完成版（draft）, false: 残り3割で完成版（final）
  locale: string;
}

// メモからキーワードを抽出する簡易関数
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // 簡易的なキーワード抽出（名詞っぽい単語を抽出）
  const keywords: string[] = [];
  const sentences = text.split(/[。．\n]/);
  
  for (const sentence of sentences) {
    // 15文字以上の文から重要そうな部分を抽出
    if (sentence.length >= 15) {
      keywords.push(sentence.trim().substring(0, 30));
    }
  }
  
  return keywords.slice(0, 3); // 最大3つまで
}

async function generatePlaceholder({
  sessions,
  activityName,
  goalTitle,
  userName,
  currentMood,
  currentDuration,
  isPreGeneration,
  locale
}: GeneratePlaceholderParams): Promise<string> {
  // セッション回数
  const sessionCount = sessions.length;

  // 初回の場合
  if (sessionCount === 0) {
    const namePrefix = userName ? `${userName}さん、` : '';
    return locale === 'ja' 
      ? `${namePrefix}最初の記録です。今日の取り組みについて、何か思ったことはありましたか？`
      : `${userName ? userName + ', ' : ''}Your first focus on this activity. What did you feel about it today?`;
  }

  // 前回のセッション情報
  const lastSession = sessions[0];
  const lastMood = lastSession.mood_score;
  const lastDuration = lastSession.duration; // 秒単位

  // 分析データを構築
  const analysisData: Record<string, any> = {
    userName: userName || null, // ユーザー名を追加
    sessionCount: sessionCount + 1, // 今回を含む
    isFirstTime: sessionCount === 0,
    activityName,
    goalTitle,
    isPreGeneration,
    generationType: isPreGeneration ? 'draft' : 'final',
    completionLevel: isPreGeneration ? '70%' : '100%', // 完成度を明示
  };

  // 【draft（開始時）】過去のメモ、気分、時間を詳細に分析して7割完成の具体的な問いかけを作る
  // 【final（終了時）】draftで作った内容に、今回との比較データを加えて残り3割を完成させる
  
  // === 過去データの詳細分析（draft、final両方で使用） ===
  
  // 前回の気分を詳細に記録
  if (lastMood) {
    const getMoodLabel = (score: number, locale: string) => {
      if (locale === 'ja') {
        return score === 5 ? '最高' : score === 4 ? '良い' : score === 3 ? 'ふつう' : score === 2 ? 'イマイチ' : 'つらい';
      } else {
        return score === 5 ? 'Excellent' : score === 4 ? 'Good' : score === 3 ? 'Okay' : score === 2 ? 'Not Great' : 'Tough';
      }
    };
    analysisData.previousMood = {
      score: lastMood,
      label: getMoodLabel(lastMood, locale)
    };
  }
  
  // 前回の時間を詳細に記録
  if (lastDuration) {
    const lastMinutes = Math.round(lastDuration / 60);
    const hours = Math.floor(lastMinutes / 60);
    const remainingMinutes = lastMinutes % 60;
    const displayText = lastMinutes >= 60 
      ? (locale === 'ja' ? `${hours}時間${remainingMinutes}分` : `${hours}h ${remainingMinutes}m`)
      : (locale === 'ja' ? `${lastMinutes}分` : `${lastMinutes}m`);
    analysisData.previousDuration = {
      seconds: lastDuration,
      minutes: lastMinutes,
      hours: hours,
      displayText: displayText
    };
  }

  // 前回のメモ内容（draft用に詳細に）
  if (lastSession.notes) {
    analysisData.previousNotes = {
      full: lastSession.notes,
      preview: lastSession.notes.substring(0, 200), // より長く
      keywords: extractKeywords(lastSession.notes), // キーワード抽出
    };
  }

  // 前回の気分メモ
  if (lastSession.mood_notes) {
    analysisData.previousMoodNotes = {
      full: lastSession.mood_notes,
      preview: lastSession.mood_notes.substring(0, 200),
      keywords: extractKeywords(lastSession.mood_notes),
    };
  }

  // === 今回のデータとの比較（finalのみ） ===
  if (!isPreGeneration) {
    // 気分の比較
    if (currentMood && lastMood) {
      const moodDiff = currentMood - lastMood;
      const trendText = moodDiff > 0 
        ? (locale === 'ja' ? '向上' : 'improved')
        : moodDiff < 0 
        ? (locale === 'ja' ? '低下' : 'declined')
        : (locale === 'ja' ? '同じ' : 'same');
      analysisData.moodComparison = {
        previous: lastMood,
        current: currentMood,
        difference: moodDiff,
        trend: moodDiff > 0 ? 'improved' : moodDiff < 0 ? 'declined' : 'same',
        trendText: trendText
      };
    }

    // 時間の比較
    if (currentDuration && lastDuration) {
      const durationDiff = currentDuration - lastDuration;
      const minutesDiff = Math.round(durationDiff / 60);
      const trendText = durationDiff > 300 
        ? (locale === 'ja' ? '長い' : 'longer')
        : durationDiff < -300 
        ? (locale === 'ja' ? '短い' : 'shorter')
        : (locale === 'ja' ? '同じくらい' : 'similar');
      analysisData.durationComparison = {
        previous: Math.round(lastDuration / 60),
        current: Math.round(currentDuration / 60),
        differenceMinutes: minutesDiff,
        trend: durationDiff > 300 ? 'longer' : durationDiff < -300 ? 'shorter' : 'similar',
        trendText: trendText
      };
    }
  }

  // Anthropic APIでプレースホルダーを生成
  try {
    console.log('[Placeholder Generation] locale:', locale, 'isPreGeneration:', isPreGeneration);
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = locale === 'ja' 
      ? `あなたは努力を見守るShoninです。ユーザーがセッション終了後に振り返りを書く際のプレースホルダーテキストを生成します。

**重要：必ず日本語で応答してください。**

【重要な生成タイプの違い】
generationType が "draft" の場合：
  - セッション開始時の先行生成（7割の完成度）
  - 過去のデータ（メモ内容・気分・時間・課題）を分析
  - 前回との比較を簡潔に織り込む

generationType が "final" の場合：
  -「前回は〇〇分取り組んでいましたね。」「前回のメモに書いていた〇〇、今日はどうでしたか？」「前回は〇〇な気分でしたが、」
  - draftで作った文章に、今回の気分・時間などの比較文を入れて微調整
    - セッション終了時の完成
  - moodComparisonやdurationComparisonを活用して、違いを追加

要件：
- **日本語で応答する**
- 1文のみ、40文字以内の簡潔な文章
- userNameが提供されている場合は必ず「〇〇さん、」から始める（例：「太郎さん、前回は...」「花子さん、今日は...」）
- userNameがnullの場合は名前なしで始める
- ユーザーの状況に合わせた励ましや問いかけ。絶対にポジティブ。
- 親しみやすく、優しい口調
- 絶対に一文で、句点は一つのみ

禁止事項：
- 何回目の〜ですね。みたいなのは絶対にしないでください
- 〜しませんでしたが、みたいなのは禁止。できたことに目を向けよう
- 体験、経験、学び、発見、気づき、気持ち、変わらず、普通、ネガティブ、イマイチなどのワードは禁止
`

      : `You are Shonin, witnessing users' efforts. Generate a placeholder text for the reflection input field.

**CRITICAL: You MUST respond ONLY in English. Even if the user's name or past notes are in Japanese, generate your response entirely in English.**

【Important Generation Type Differences】
When generationType is "draft":
  - Pre-generation at session start (70% complete)
  - Thoroughly analyze past data (notes content, mood trends, time trends, achievements/challenges)
  - Generate specific questions from past patterns
  - Incorporate previous mood, time, and specific note contents
  - Example: "Last time you spent X minutes." "About that X from last notes, how was it today?" "Last time your mood was Y,"

When generationType is "final":
  - Complete generation at session end (remaining 30% for 100% complete)
  - Build on draft, fine-tune with current mood/time comparison
  - Use moodComparison and durationComparison to add today's differences
  - Example: "Your mood improved from last time. What changed?" "10 minutes longer than last time. How was it?"

Requirements:
- **RESPOND IN ENGLISH ONLY**
- One sentence only, within 50 characters
- If userName is provided, always start with "userName, " (e.g., "Daisuke, last time..." "Taro, today...")
- If userName is null, start without name
- Encouraging or questioning based on user's situation
- Friendly and gentle tone
- For draft: incorporate specific past data (aim for 70% complete)
- For final: add current comparison to draft content (remaining 30%)
- Must be a single sentence with one period

Prohibitions:
- **DO NOT use Japanese. Use English only.**
- Never mention session counts like "third session" or "nth time"
- Focus on what was accomplished, not what wasn't
- Banned words: experience, learning, discovery, insight, feeling, unchanged`;

    const userPrompt = JSON.stringify(analysisData, null, 2);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: isPreGeneration ? 200 : 150, // draftは詳細に、finalは微調整のみ
      temperature: isPreGeneration ? 0.8 : 0.75, // draftはしっかり分析、finalは比較に集中
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

    return placeholder || getDefaultPlaceholder(sessionCount, userName, locale);

  } catch (error) {
    safeError('Anthropic API エラー', error);
    return getDefaultPlaceholder(sessionCount, userName, locale);
  }
}

function getDefaultPlaceholder(sessionCount: number, userName: string | null, locale: string): string {
  const namePrefix = userName ? (locale === 'ja' ? `${userName}さん、` : `${userName}, `) : '';
  
  if (locale === 'ja') {
    if (sessionCount === 0) {
      return `${namePrefix}最初の記録です。今日の取り組みについて、何か思ったことはありましたか？`;
    } else if (sessionCount === 1) {
      return `${namePrefix}前回との違いなど、気づいたことはありますか？`;
    } else {
      return `${namePrefix}今日の発見を残しておきましょう。`;
    }
  } else {
    if (sessionCount === 0) {
      return `${namePrefix}Your first focus on this activity. What did you feel about it today?`;
    } else if (sessionCount === 1) {
      return `${namePrefix}Notice any differences from last time?`;
    } else {
      return `${namePrefix}Let's capture today's insights.`;
    }
  }
}
