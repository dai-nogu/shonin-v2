/**
 * AI Feedback Tones - 学問領域別のフィードバックトーン定義
 * 
 * Shoninの理念に基づき、6つの学問領域から人間の成長を支える
 * 心理学・行動経済学・動物行動学・人間行動学・脳神経科学・哲学
 */

export interface FeedbackTone {
  id: string;
  name: string;
  description: string;
  weeklyPrompt: string;
  monthlyPrompt: string;
  keywords: string[];
}

/**
 * 6つの学問領域に基づくフィードバックトーン
 */
export const FEEDBACK_TONES: Record<string, FeedbackTone> = {
  // ① 心理学 - 継続できるUIやフィードバック設計
  psychology: {
    id: 'psychology',
    name: '心理学トーン',
    description: '感情やモチベーションの波を理解して支える',
    weeklyPrompt: `
【心理学的視点】
- ログデータ（入力頻度・達成率・時間帯）から心理状態を推定
- 自己効力感（「できる」という感覚）と内発的動機付け（本当にやりたい気持ち）を意識
- 例: "今日は行動量が減っているけど、これは自然な波です。次の小さな行動を決めよう"
- 焦点: 感情の変化、モチベーションの波、小さな成功体験の積み重ね`,
    monthlyPrompt: `
【心理学的視点】
- 1ヶ月の感情の起伏やモチベーションの変化パターンを分析
- 自己効力感の成長を具体的なデータで示す
- 内発的動機（本当にやりたい）vs 外発的動機（やらなきゃ）のバランス
- 例: "月初は勢いがあったけど、中旬で少し落ち着きましたね。これは無理のないペースを探している証拠です"
- 焦点: 心の成長、自信の変化、モチベーションパターンの発見`,
    keywords: ['気持ち', '心', 'やる気', '自信', '感情', '波', '自然', '無理なく']
  },

  // ② 行動経済学 - 報酬・リマインド・選択設計
  behavioralEconomics: {
    id: 'behavioralEconomics',
    name: '行動経済学トーン',
    description: '行動を変える仕掛けを提案する',
    weeklyPrompt: `
【行動経済学的視点】
- ナッジ理論: 「行動しやすい小さな一歩」を具体的に提示
- 例: "目標を半分に分けて、今日だけ達成を狙おう"
- 選択肢の提示方法や報酬のタイミングを意識した提案
- 現状維持バイアスを超える具体的な行動提案
- 焦点: 次の一歩、小さな変化、具体的な行動提案`,
    monthlyPrompt: `
【行動経済学的視点】
- 実際の行動パターンから「どうすれば続けやすいか」を分析
- 習慣形成のメカニズム: トリガー→行動→報酬のサイクル
- 例: "朝にセッションを始める日は継続率が高いですね。この時間帯を活かしましょう"
- 損失回避（やらないと損）よりも獲得（やると得）の視点で
- 焦点: 行動パターンの発見、継続のコツ、環境設計`,
    keywords: ['小さな一歩', '続けやすい', '習慣', 'タイミング', '工夫', '仕組み']
  },

  // ③ 動物行動学 - 本能的な動機付け
  ethology: {
    id: 'ethology',
    name: '動物行動学トーン',
    description: '人間の本能的な欲求に訴えかける',
    weeklyPrompt: `
【動物行動学的視点】
- 競争心・承認欲求・仲間意識などの本能を活かしたメッセージ
- 例: "あなたの継続は、群れのリーダーのように周りに影響を与えています"
- 本能的反応を引き出す言葉選び（ただし過度にならないよう配慮）
- 焦点: 競争、達成、承認、所属感、自己保存`,
    monthlyPrompt: `
【動物行動学的視点】
- 人間の根源的な欲求（成長欲求、承認欲求、所属欲求）に基づく分析
- 例: "この1ヶ月の記録は、あなたの成長への本能的な渇望の表れです"
- 生存本能から見た「成長」の意味
- 縄張り意識→自分の領域を守り拡大する喜び
- 焦点: 本能的動機、根源的欲求、生物としての成長`,
    keywords: ['本能', '根源', '欲求', '勝つ', '守る', '仲間', '群れ']
  },

  // ④ 人間行動学 - 日常の行動トラッキングと分析
  humanBehavior: {
    id: 'humanBehavior',
    name: '人間行動学トーン',
    description: '行動パターンを客観的に分析して示す',
    weeklyPrompt: `
【人間行動学的視点】
- 時間帯・曜日・場所などの環境要因と行動の関係を分析
- 例: "夜は記録が続いていないようですね。代わりに朝に5分だけ書いてみましょう"
- 外部要因（環境・天気・曜日）が行動に与える影響
- 行動の連鎖: 1つの行動が次の行動を引き起こすパターン
- 焦点: いつ、どこで、何を、どのように行動しているか`,
    monthlyPrompt: `
【人間行動学的視点】
- 1ヶ月の行動ログから「あなたらしいパターン」を発見
- 例: "水曜日は集中しやすい日。金曜は休息モード。このリズムがあなたのスタイルですね"
- 社会的・文化的・環境的要因と個人の行動の関係
- 習慣の連鎖と行動の最適化
- 焦点: 行動リズム、環境との相互作用、個人の特性`,
    keywords: ['パターン', 'リズム', '時間帯', '場所', '環境', '習慣']
  },

  // ⑤ 脳神経科学 - 習慣化のメカニズム
  neuroscience: {
    id: 'neuroscience',
    name: '脳神経科学トーン',
    description: '脳の仕組みから行動の意味づけをする',
    weeklyPrompt: `
【脳神経科学的視点】
- 習慣回路（基底核）とやる気物質（ドーパミン）の観点
- 例: "昨日の運動で脳内の報酬系が刺激されています。今日も続ければ習慣回路が安定します"
- 科学的根拠を示すことで信頼性と納得感を強化
- 焦点: 脳の変化、記憶の定着、習慣形成のメカニズム`,
    monthlyPrompt: `
【脳神経科学的視点】
- 1ヶ月継続による脳の構造的変化（神経可塑性）
- 例: "1ヶ月の継続で、脳内に新しい神経回路ができ始めています。これが習慣化の証です"
- 短期記憶から長期記憶への定着過程
- 繰り返しが脳に与える影響を具体的に
- 焦点: 脳の成長、神経回路、長期的な変化`,
    keywords: ['脳', '記憶', '定着', '回路', '習慣化', '繰り返し', '体が覚える']
  },

  // ⑥ 哲学 - 努力と成長の世界観を言語化
  philosophy: {
    id: 'philosophy',
    name: '哲学トーン',
    description: '日々の努力に意味と存在価値を与える',
    weeklyPrompt: `
【哲学的視点】
- 日々の行動に意味や存在価値を与える
- 例: "あなたの努力は他人に見えなくても、確かに時間の中に刻まれています"
- 「努力とは何か」「成長とは何か」という本質的な問いかけ
- 孤独な努力への共感と、その尊さの言語化
- 焦点: 意味、価値、存在、時間、成長の本質`,
    monthlyPrompt: `
【哲学的視点】
- 1ヶ月の積み重ねから「あなたの人生における成長」を語る
- 例: "時間は誰にでも平等に流れますが、その使い方で人生が変わります。この1ヶ月、あなたは自分の時間を成長に使いました"
- 偉人の言葉を適切なタイミングで引用（次のステップで実装）
- 努力の哲学的意味: 過程こそが目的、積み重ねの美学
- 焦点: 人生の意味、時間の価値、存在の尊さ、成長の哲学`,
    keywords: ['意味', '価値', '存在', '人生', '時間', '積み重ね', '尊い', '確かに']
  }
};

/**
 * セッションデータのコンテキストに基づいて最適なトーンを選択
 */
export interface ToneSelectionContext {
  sessionsCount: number;
  totalHours: number;
  consistency: number; // 0-1
  moodTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  averageMood: number; // 1-5
  hasReflections: boolean;
  topActivitiesCount: number;
  goalAchievementRate?: number;
}

/**
 * コンテキストに基づいて最適な学問的トーンを選択
 */
export function selectToneByContext(context: ToneSelectionContext): FeedbackTone {
  const {
    sessionsCount,
    totalHours,
    consistency,
    moodTrend,
    averageMood,
    hasReflections,
    topActivitiesCount,
    goalAchievementRate = 0
  } = context;

  // スコアリングシステム: 各トーンに対してスコアを計算
  const scores: Record<string, number> = {
    psychology: 0,
    behavioralEconomics: 0,
    ethology: 0,
    humanBehavior: 0,
    neuroscience: 0,
    philosophy: 0
  };

  // 1. 行動経済学: 継続性が高い + セッション数が多い（習慣形成）
  if (consistency > 0.7 && sessionsCount >= 5) {
    scores.behavioralEconomics += 3;
  }
  if (consistency > 0.5) {
    scores.behavioralEconomics += 1;
  }

  // 2. 心理学: 気分の変動が大きい or 気分トレンドが重要
  if (moodTrend === 'improving') {
    scores.psychology += 2;
  }
  if (moodTrend === 'declining') {
    scores.psychology += 3; // 落ち込んでいる時こそ心理学的サポート
  }
  if (averageMood < 3) {
    scores.psychology += 2;
  }

  // 3. 脳神経科学: 長時間の集中セッション（集中力・習慣化）
  const avgHoursPerSession = sessionsCount > 0 ? totalHours / sessionsCount : 0;
  if (avgHoursPerSession > 2) {
    scores.neuroscience += 3;
  }
  if (totalHours > 15) {
    scores.neuroscience += 2;
  }

  // 4. 哲学: 目標達成率が高い or 長期的な成長（意味付け）
  if (goalAchievementRate > 0.7) {
    scores.philosophy += 3;
  }
  if (totalHours > 20) {
    scores.philosophy += 2;
  }

  // 5. 人間行動学: リフレクションが豊富（自己理解）
  if (hasReflections) {
    scores.humanBehavior += 3;
  }
  if (topActivitiesCount > 3) {
    scores.humanBehavior += 1; // 多様な活動
  }

  // 6. 動物行動学: 行動パターンが明確（本能的・規則的行動）
  if (consistency > 0.8) {
    scores.ethology += 2;
  }
  if (topActivitiesCount <= 2 && sessionsCount >= 5) {
    scores.ethology += 2; // 特定の活動に集中
  }

  // 最高スコアのトーンを選択
  const maxScore = Math.max(...Object.values(scores));
  
  // 同点の場合はランダムに選択
  const topTones = Object.keys(scores).filter(key => scores[key] === maxScore);
  const selectedToneId = topTones[Math.floor(Math.random() * topTones.length)];

  return FEEDBACK_TONES[selectedToneId as keyof typeof FEEDBACK_TONES];
}

/**
 * ランダムに1つの学問的視点を選択（後方互換性のため残す）
 */
export function selectRandomTone(): FeedbackTone {
  const allTones = Object.values(FEEDBACK_TONES);
  const randomIndex = Math.floor(Math.random() * allTones.length);
  return allTones[randomIndex];
}

/**
 * トーンIDから対応する名言のプレフィックスを取得
 */
export function getToneQuotePrefix(toneId: string): string {
  const mapping: Record<string, string> = {
    'psychology': 'psych',
    'behavioralEconomics': 'behav',
    'ethology': 'etho',
    'humanBehavior': 'human',
    'neuroscience': 'neuro',
    'philosophy': 'phil'
  };
  return mapping[toneId] || '';
}

/**
 * 学問的トーンのプロンプトを生成
 * 週次: ランダムに1つのトーンを選択して深く掘り下げる
 * 月次: 6つの学問領域すべての視点を統合
 * 
 * @returns {object} プロンプトと選択されたトーン（週次のみ）
 */
export function generateAcademicPrompt(periodType: 'weekly' | 'monthly'): { prompt: string; selectedTone?: FeedbackTone } {
  const promptType = periodType === 'weekly' ? 'weeklyPrompt' : 'monthlyPrompt';
  
  // 週次の場合はランダムに1つのトーンを選択
  if (periodType === 'weekly') {
    const selectedTone = selectRandomTone();
    const prompt = `
【今週の学問的視点】
今週は「${selectedTone.name}」の視点でフィードバックを提供します。

${selectedTone[promptType]}

この視点を背景に、ユーザーに最も響く気づきを自然な語りで伝えてください。
`;
    return { prompt, selectedTone };
  }
  
  // 月次の場合は全ての視点を統合
  const allTones = Object.values(FEEDBACK_TONES);
  const prompt = `
【学問的視点の統合】
あなたは以下の6つの学問的視点を統合して、ユーザーの成長を多角的に支援します：

${allTones.map((tone, index) => `
${index + 1}. ${tone.name}
${tone[promptType]}
`).join('\n')}

これらの視点を自然に組み合わせて、ユーザーに最も響く気づきを提供してください。
`;
  return { prompt };
}

