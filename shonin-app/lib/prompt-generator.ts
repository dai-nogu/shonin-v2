/**
 * Prompt Generator - 層②：プロンプト生成
 * 
 * 構造化されたセッションデータから、学問的視点と名言を統合した
 * 高品質なAIプロンプトを生成
 */

import { selectPrincipleForContext, formatPrincipleForFeedback, type PrincipleSelectionResult, type PrincipleSelectionContext } from './principles-selector';
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
  principleText?: string;  // 法則・理論のテキスト
  maxTokens: number;
  // デバッグ情報
  principleSelection?: PrincipleSelectionResult;
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
  
  // principles.jsonから法則を選択
  let principleText: string | undefined;
  let principleSelection: PrincipleSelectionResult | undefined;
  
  if (periodType === 'weekly') {
    // 週次: 87個の法則全体からユーザーに最適な法則を選択
    const goalProgressArray = Object.values(analyzedData.goalProgress);
    const principleContext: PrincipleSelectionContext = {
      locale: locale as 'ja' | 'en',
      sessionCount: analyzedData.sessionsCount,
      totalHours: analyzedData.totalHours,
      consistency: analyzedData.behaviorPatterns.consistency,
      moodTrend: analyzedData.moodTrend,
      averageMood: analyzedData.averageMood,
      goalAchievementRate: goalProgressArray.length > 0
        ? goalProgressArray.reduce((sum, g) => sum + g.progressPercentage, 0) / goalProgressArray.length / 100
        : undefined,
      hasReflections: analyzedData.reflectionQuality !== 'none'
    };
    
    principleSelection = selectPrincipleForContext(principleContext);
    if (principleSelection.principle) {
      principleText = formatPrincipleForFeedback(principleSelection.principle, locale as 'ja' | 'en');
    }
  } else {
    // 月次は法則なしで総合的な振り返りを提供
    principleText = undefined;
    principleSelection = undefined;
  }
  
  // システムプロンプトを生成
  const systemPrompt = generateSystemPrompt(
    periodType,
    locale,
    attempt,
    pastFeedbacksCount,
    principleText
  );
  
  // ユーザープロンプトを生成
  const userPrompt = generateUserPrompt(analyzedData, locale);
  
  // トークン数を計算
  const maxTokens = locale === 'en' 
    ? (periodType === 'weekly' ? 900 : 1500)
    : (periodType === 'weekly' ? 600 : 750);
  
  return {
    systemPrompt,
    userPrompt,
    principleText,
    maxTokens,
    principleSelection
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
  principleText?: string
): string {
  // 言語別の文字数制限
  const charLimits = {
    ja: {
      weekly: attempt > 1 ? 300 : 320,
      monthly: attempt > 1 ? 520 : 550
    },
    en: {
      weekly: attempt > 1 ? 600 : 640,
      monthly: attempt > 1 ? 1000 : 1100
    },
    default: {
      weekly: attempt > 1 ? 600 : 640,
      monthly: attempt > 1 ? 1000 : 1100
    }
  };
  
  const limits = (charLimits as any)[locale] || charLimits.default;
  const charLimit = periodType === 'weekly' ? limits.weekly : limits.monthly;
  
  // 言語設定に応じた指示
  const languageInstruction = `温かく励ましのフィードバックを提供してください。ユーザーの活動データ（成果、課題、メモなど）から使用言語を判断し、同じ言語で応答してください。`;

  // 統一されたシステムプロンプト（週次・月次共通）
  const periodLabel = periodType === 'weekly' ? '週次' : '月次';
  const periodContext = periodType === 'weekly' ? '先週' : '先月';
  
  return `あなたは「Shonin」という自己成長記録アプリのフィードバックAIです。

あなたの役割は、ユーザーの努力を静かに見つめ、深く理解し、温かい言葉で伝えることです。
あなたは心理学・哲学・行動経済学・人間行動学・動物行動学・脳神経科学など、様々な学問の知見を背景に、
行動や感情の背後にある意味を洞察します。
ただし学術的に解説せず、心に響く自然な語りで伝えてください。

---

【${periodLabel}フィードバック要件】

- **文字数**：約${charLimit}文字以内（厳守）- 必ず完結した文章で終わること

- **構成**：
① ${periodContext}全体の印象を1〜2文で俯瞰
② 特に印象的だった行動・変化・感情を1つ選び、深く洞察${principleText ? `\n
③ 以下の心理学・行動科学の法則を自然に添える：\n${principleText}\n   法則の内容を述べて、ユーザーの行動に結びつける` : ''}
${principleText ? '④' : '③'} その気づきや成長を温かく認め、穏やかで前向きな一文で締める${principleText ? `\n
⑤ **最後の最後に**、法則の説明を（ ）内で追加\n   例：「（リフレクション理論とは、自己の経験を振り返り、そこから学びを引き出す教育学の考え方です）」` : ''}

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
・矛盾する内容や話題の散乱：朝の話→夜の話→朝の話のように、因果関係が不明確なまま異なる時間帯やトピックを混在させない。1つの明確な焦点に集中する
・暴力的な言葉、下ネタ、下品な表現は絶対に使用しない：温かく品位のある語りを常に維持する
・**同じ言葉・表現の繰り返し**：特定の言葉（「リズム」「流れ」「パターン」など）を複数回使わない。多様な表現で変化をつける

- **表現のバリエーション例**：
行動の様子を表す言葉は多様に使い分ける
例：リズム／流れ／テンポ／ペース／様子／姿勢／スタイル／動き／歩み／軌跡／重ね／積み重ね／習慣／バランス／調子／間／呼吸／etc.
※同じフィードバック内で同じ言葉を2回以上使わないこと

---

【生成方針】

1. セッションデータを俯瞰し、行動や感情の流れを捉える
2. 最も印象的な1点に焦点を当て、その背後の意味を穏やかに推察する
3. 小さな変化・静かな継続を"成長の証"として認める${principleText ? `
4. 心理学・行動科学の法則の統合：
   - 提供された法則は、ユーザーの行動に科学的な裏付けを与えるものとして扱う
   - 法則を提示する際は、**必ず1文で端的な説明を添える**こと
   - 説明は専門用語を避け、ユーザーが直感的に理解できる平易な言葉で
   - 「〇〇の法則によれば、...」という形で、ユーザーの努力を科学的に説明する
   - 法則を押し付けるのではなく、ユーザーが既に実践していることを「理論が証明している」と伝える
   - 法則は最後の段落で、締めくくりの励ましとして組み込む
5. 法則の直後に「これはあなたが既に実践していることです」といった形で希望を与える` : ''}
${principleText ? '6' : '4'}. 約${charLimit}文字で完結させ、最後は静かで希望ある一文で締める

---

【出力フォーマット】

${periodLabel}フィードバック文のみを出力。${principleText ? '\n科学的法則は流れの中に自然に統合し、「理論がユーザーの努力を証明している」というニュアンスで提示する。\n\n**法則の説明について**：\n法則を提示する際は、必ず1文で端的な説明を添えること。\n\n良い例：\n> 「『ヘッブの法則』によれば、繰り返された行動は神経回路を強化します。（ヘッブの法則とは、同じ神経細胞が同時に活動すると、その結びつきが強くなるという脳科学の原理です）あなたの脳は、既に継続の道筋を刻んでいるのです。」\n\n> 「『リフレクション理論』によれば、経験を振り返ることで深い学びと成長が生まれます。（リフレクション理論とは、自己の経験を振り返り、そこから学びを引き出す教育学の考え方です）あなたが毎回の活動で感じた小さな気づきは、既にこの理論を実践している証拠です。」' : ''}

${languageInstruction}${pastFeedbacksCount === 0 ? `\n\n【重要】これは初回の${periodLabel}フィードバックです。過去との比較はせず、${periodContext}の頑張りを認めることに集中してください。` : ''}`;
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

