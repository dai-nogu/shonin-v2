/**
 * Prompt Generator - 層②：プロンプト生成
 * 
 * 構造化されたセッションデータから、学問的視点と名言を統合した
 * 高品質なAIプロンプトを生成
 */

import { generateAcademicPrompt, selectToneByContext, type ToneSelectionContext } from './ai-feedback-tones';
import { selectQuoteForContext, selectQuoteByTone, formatQuoteSimple, type QuoteSelectionContext } from './quotes-selector';
import type { AnalyzedSessionData } from './session-analyzer';

/**
 * プロンプト生成の設定
 */
export interface PromptGenerationConfig {
  locale: string;
  attempt: number;
  pastFeedbacksCount: number;
}

/**
 * 生成されたプロンプトセット
 */
export interface GeneratedPrompts {
  systemPrompt: string;
  userPrompt: string;
  inspirationalQuote?: string;
  maxTokens: number;
}

/**
 * 構造化データからプロンプトを生成
 */
export function generatePrompts(
  analyzedData: AnalyzedSessionData,
  config: PromptGenerationConfig
): GeneratedPrompts {
  const { locale, attempt, pastFeedbacksCount } = config;
  const { periodType } = analyzedData;
  
  // quotes.jsonから名言を選択
  let inspirationalQuote: string | undefined;
  let academicPrompt: string;
  
  if (periodType === 'weekly') {
    // 週次: セッションデータから最適なトーンを選択
    const goalProgressArray = Object.values(analyzedData.goalProgress);
    const toneContext: ToneSelectionContext = {
      sessionsCount: analyzedData.sessionsCount,
      totalHours: analyzedData.totalHours,
      consistency: analyzedData.behaviorPatterns.consistency,
      moodTrend: analyzedData.moodTrend,
      averageMood: analyzedData.averageMood,
      hasReflections: analyzedData.reflectionQuality !== 'none',
      topActivitiesCount: analyzedData.topActivities.length,
      goalAchievementRate: goalProgressArray.length > 0
        ? goalProgressArray.reduce((sum, g) => sum + g.progressPercentage, 0) / goalProgressArray.length / 100
        : 0
    };
    
    const selectedTone = selectToneByContext(toneContext);
    
    // 選ばれたトーンのプロンプトを生成
    const academicResult = generateAcademicPrompt(periodType);
    academicPrompt = `
【今週の学問的視点】
今週は「${selectedTone.name}」の視点でフィードバックを提供します。

${selectedTone.weeklyPrompt}

この視点を背景に、ユーザーに最も響く気づきを自然な語りで伝えてください。
`;
    
    // 選ばれたトーンと同じ分野の名言を選択
    const selectedQuote = selectQuoteByTone(
      selectedTone.id,
      locale as 'ja' | 'en',
      analyzedData.sessionsCount,
      analyzedData.totalHours
    );
    if (selectedQuote) {
      inspirationalQuote = formatQuoteSimple(selectedQuote, locale as 'ja' | 'en');
    }
  } else {
    // 月次: 全ての視点を統合
    const academicResult = generateAcademicPrompt(periodType);
    academicPrompt = academicResult.prompt;
    
    // コンテキストに基づいて名言を選択
    const quoteContext: QuoteSelectionContext = {
      periodType,
      locale: locale as 'ja' | 'en',
      sessionCount: analyzedData.sessionsCount,
      totalHours: analyzedData.totalHours,
      mood: analyzedData.averageMood >= 4 ? 'positive' : 
            analyzedData.averageMood >= 3 ? 'neutral' : 'challenging',
      primaryTheme: determinePrimaryTheme(analyzedData)
    };
    
    const selectedQuote = selectQuoteForContext(quoteContext);
    if (selectedQuote) {
      inspirationalQuote = formatQuoteSimple(selectedQuote, locale as 'ja' | 'en');
    }
  }
  
  // システムプロンプトを生成
  const systemPrompt = generateSystemPrompt(
    periodType,
    locale,
    attempt,
    pastFeedbacksCount,
    academicPrompt,
    inspirationalQuote
  );
  
  // ユーザープロンプトを生成
  const userPrompt = generateUserPrompt(analyzedData, locale);
  
  // トークン数を計算
  const maxTokens = locale === 'en' 
    ? (periodType === 'weekly' ? 600 : 1500)
    : (periodType === 'weekly' ? 400 : 750);
  
  return {
    systemPrompt,
    userPrompt,
    inspirationalQuote,
    maxTokens
  };
}

/**
 * 主要テーマを判定
 */
function determinePrimaryTheme(data: AnalyzedSessionData): string {
  // 総時間が多い → 成長
  if (data.totalHours > 10) return 'growth';
  
  // セッション数が多い → 継続
  if (data.sessionsCount > 5) return 'continuity';
  
  // 気分が改善傾向 → 前向き
  if (data.moodTrend === 'improving') return 'resilience';
  
  // 一貫性が高い → 習慣
  if (data.behaviorPatterns.consistency > 0.7) return 'habit';
  
  // デフォルト
  return 'effort';
}

/**
 * システムプロンプトを生成
 */
function generateSystemPrompt(
  periodType: 'weekly' | 'monthly',
  locale: string,
  attempt: number,
  pastFeedbacksCount: number,
  academicPrompt: string,
  inspirationalQuote?: string
): string {
  // 言語別の文字数制限
  const charLimits = {
    ja: {
      weekly: attempt > 1 ? 180 : 200,
      monthly: attempt > 1 ? 520 : 550
    },
    en: {
      weekly: attempt > 1 ? 350 : 400,
      monthly: attempt > 1 ? 1000 : 1100
    },
    default: {
      weekly: attempt > 1 ? 350 : 400,
      monthly: attempt > 1 ? 1000 : 1100
    }
  };
  
  const limits = (charLimits as any)[locale] || charLimits.default;
  const charLimit = periodType === 'weekly' ? limits.weekly : limits.monthly;
  
  // 言語設定に応じた指示
  const languageInstruction = locale === 'ja' 
    ? '温かく励ましのフィードバックを日本語で提供してください。'
    : `温かく励ましのフィードバックを、ユーザーの言語設定（${locale === 'en' ? '英語' : locale}）で提供してください。`;

  // 週次と月次で異なるプロンプトを生成
  if (periodType === 'weekly') {
    return `あなたは「Shonin」という自己成長記録アプリのフィードバックAIです。

あなたの役割は、ユーザーの努力を静かに見つめ、深く理解し、温かい言葉で伝えることです。
あなたは心理学・哲学・行動経済学・人間行動学・動物行動学・脳神経科学の6分野に通じています。
これらの知見を背景に、行動や感情の背後にある意味を洞察します。
ただし学術的に解説せず、心に響く自然な語りで伝えてください。

${academicPrompt}

---

【週次フィードバック要件】

- **文字数**：日本語で約200文字以内（厳守）

- **構成**：
　① 先週全体の印象を1〜2文で俯瞰
　② 特に印象的だった行動・変化・感情を1つ選び、深く洞察
　③ その気づきや成長を温かく認める
　④ 以下の名言（quotes.jsonから選択済み）を**必ずそのまま**自然に添える：${inspirationalQuote ? `\n　　『${inspirationalQuote}』` : '（名言が選択されませんでした）'}
　⑤ 穏やかで前向きな一文で締める

- **文体・トーン**：
　・理解者として柔らかく、落ち着いた語り
　・命令ではなく、共感・気づき・静かな励まし
　・短く、呼吸の間を感じるリズムで
　・「〜です」「〜ですね」「〜でしょう」など穏やかな言い切り（「〜かもしれません」など曖昧な推測表現は禁止）

- **禁止事項**：
　・専門用語、箇条書き、分析的説明
　・成果を比較・評価する表現
　・「頑張れ」「〜すべき」などの命令
　・「〜かもしれません」「〜と思います」などの曖昧で無責任な推測表現

---

【生成方針】

1. セッションデータを俯瞰し、行動や感情の流れを捉える
2. 最も印象的な1点に焦点を当て、その背後の意味を穏やかに推察する
3. 小さな変化・静かな継続を"成長の証"として認める
4. quotes.json から同分野・同トーンの名言を選び、自然に流れの中へ組み込む
5. 名言の直後に **（著者／出典名）** を明示する
6. 約200文字で完結させ、最後は静かで希望ある一文で締める

---

【出力フォーマット】

週次フィードバック文のみを出力。
引用は流れの中に自然に統合し、必ず出典（著者または書名）をカッコ書きで含める。

例：
> 「今週のあなたの集中はとても穏やかでした。迷いながらも歩みを止めなかった姿勢に変化が見えます。『沈黙の中に最も深い理解がある』（禅の教え）。焦らず、この静けさを続けましょう。」

${languageInstruction}${pastFeedbacksCount === 0 ? '\n\n【重要】これは初回の週次フィードバックです。過去との比較はせず、今週の頑張りを認めることに集中してください。' : ''}`;
  }
  
  // 月次フィードバックは既存の形式を維持
  return `あなたは人間の成長を多角的に支援する専門家です。心理学、行動経済学、動物行動学、人間行動学、脳神経科学、哲学の6つの学問領域を統合し、表面的な行動だけでなく、データの奥に隠された無意識のパターン、心理的な変化の兆し、本人も気づいていない成長を発見して伝える存在です。

【最重要】文字数制限を絶対に守ること：約${charLimit}文字以内で必ず完結させ、できるだけ超過しないようにしてください。

あなたの専門性と役割：
あなたは、学際的な視点からユーザーの努力を深く理解し、データの奥に隠された本質的な意味を見抜く洞察力を持つ存在です。

${academicPrompt}

重要な心構え：
- 分析項目を機械的にチェックするのではなく、ユーザーの心に響く「本当に大切な気づき」を1-2つ見つける
- 「確かにそうだ！」「気づかなかった」「なるほど」とユーザーが納得できる具体的で説得力のある洞察を提供
- 数値や表面的な事実ではなく、その背後にある心理的な変化や成長の兆しを温かく伝える
- 要件を全て満たそうとせず、最も印象的で意味のあるポイントに集中して深く掘り下げる
- 一人の理解者として、自然で親しみやすい語りかけを心がける

ユーザーの月次の活動データを分析し、${languageInstruction}

フィードバックの要件：

【月次フィードバック要件】
- 【文字数】約${charLimit}文字以内（絶対厳守）- 必ず完結した文章で終わること
- 【核心を突く】データから最も印象的で意味のある1-2つのポイントに集中し、深く掘り下げる
- 【共感と洞察】ユーザーが「確かに！」「なるほど」「よし、頑張ろう」と心から思える気づきを提供
- 【自然な流れ】要件チェックリストではなく、一人の理解者として自然に語りかける
- 【具体的な証拠】抽象的な分析ではなく、具体的なデータや行動パターンを根拠にした説得力のある洞察
- 【成長の実感】本人も気づいていない変化や成長を、温かく具体的に伝える
- 【未来への希望】現在の努力が将来にどうつながるかを示し、継続への動機を与える
- 【構造】自然な会話調で：印象的な発見→深い分析→励ましと展望の流れ
- 先月の振り返りとして作成`;
}

/**
 * ユーザープロンプトを生成
 */
function generateUserPrompt(data: AnalyzedSessionData, locale: string): string {
  const { 
    periodStart, 
    periodEnd, 
    totalHours, 
    sessionsCount, 
    averageMood,
    topActivities,
    achievements,
    challenges,
    goalProgress,
    behaviorPatterns,
    moodTrend,
    reflectionQuality
  } = data;
  
  // アクティビティ別時間の整形
  const activitiesText = topActivities
    .map(a => `- ${a.name}: ${Math.round(a.duration / 3600 * 10) / 10}時間 (${Math.round(a.percentage)}%)`)
    .join('\n');
  
  // 目標情報の整形
  const goalsText = Object.keys(goalProgress).length > 0 
    ? Object.values(goalProgress).map((goal: any) => {
        const deadlineText = goal.deadline ? ` (期限: ${goal.deadline})` : '';
        return `- ${goal.title}: ${Math.round(goal.totalSessionTime / 3600 * 10) / 10}時間 (${goal.sessionCount}セッション)${deadlineText}
    進捗: ${goal.progressPercentage}% (目標: ${Math.round(goal.targetDuration / 3600 * 10) / 10}時間)
    活動内訳: ${Object.entries(goal.activities).map(([name, time]) => `${name} ${Math.round((time as number) / 3600 * 10) / 10}h`).join(', ')}`;
      }).join('\n\n')
    : '目標設定されたセッションなし';
  
  // 行動パターンの整形
  const topTimeOfDay = Object.entries(behaviorPatterns.timeOfDay)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([time, duration]) => `${time}: ${Math.round((duration as number) / 3600 * 10) / 10}h`)
    .join(', ');
  
  const topDayOfWeek = Object.entries(behaviorPatterns.dayOfWeek)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day, duration]) => `${day}曜日: ${Math.round((duration as number) / 3600 * 10) / 10}h`)
    .join(', ');
  
  return `期間: ${periodStart} 〜 ${periodEnd}
総活動時間: ${totalHours}時間
セッション数: ${sessionsCount}回
平均気分スコア: ${averageMood ? averageMood.toFixed(1) : '未記録'}
気分トレンド: ${moodTrend === 'improving' ? '改善傾向' : moodTrend === 'declining' ? '低下傾向' : moodTrend === 'stable' ? '安定' : '不明'}
振り返りの質: ${reflectionQuality === 'detailed' ? '詳細' : reflectionQuality === 'moderate' ? '適度' : reflectionQuality === 'minimal' ? '最小限' : 'なし'}

活動別時間（上位5つ）:
${activitiesText}

成果・学び:
${achievements || '記録なし'}

課題・改善点:
${challenges || '記録なし'}

目標別の活動状況:
${goalsText}

【行動パターン分析】
よく活動する時間帯: ${topTimeOfDay}
よく活動する曜日: ${topDayOfWeek}
継続性スコア: ${Math.round(behaviorPatterns.consistency * 100)}% (一貫した活動ペースを維持)
${Object.keys(behaviorPatterns.locations).length > 0 ? `場所: ${Object.keys(behaviorPatterns.locations).join(', ')}` : ''}`;
}

