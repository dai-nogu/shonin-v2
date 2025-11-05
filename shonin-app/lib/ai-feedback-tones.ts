/**
 * AI Feedback Tones - 学問領域別のフィードバックトーン定義
 * 
 * Shoninの理念に基づき、6つの学問領域から人間の成長を支える
 * 心理学・行動経済学・動物行動学・人間行動学・脳神経科学・哲学
 */

export interface FeedbackTone {
  id: string;
  name: string;
  prompt: string;
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
    prompt: `
【心理学的視点】

1. 分析視点の特徴
・感情の起伏やモチベーションの波形を観察
・「やる気」や「停滞」の背景にある心理的要因（ストレス・期待・達成感）を分析
・内発的動機（want）と外発的動機（should）の比率を見極める
・自己効力感（"できるかも"という感覚）の変化を小さな成功経験から読み取る
・行動そのものよりも、「行動を生み出した心理状態の変化」に焦点を当てる

2. 洞察の焦点
・ユーザーが自分の感情の流れを客観視できるようにする
・「調子の波」も成長のプロセスとして肯定的に解釈させる
・自己理解（"なぜやりたいのか"）を深めることで、内発的動機への回帰を促す
・"努力＝苦痛"ではなく、"努力＝自己実現の自然な行為"と再定義させる

3. 表現方針
・語彙は「感情」「心の動き」「気づき」「自信」など情緒的な心理語彙を中心に構成
・二元的な評価（良い／悪い、成功／失敗）を避け、「変化」や「流れ」として描く
・感情を責めず、心の自然なリズムとして受け止めさせる`,
    keywords: ['気持ち', '心', 'やる気', '自信', '感情', '波', '自然', '無理なく']
  },

  // ② 行動経済学 - 報酬・リマインド・選択設計
  behavioralEconomics: {
    id: 'behavioralEconomics',
    name: '行動経済学トーン',
    prompt: `
【行動経済学的視点】

1. 分析視点の特徴
・行動データに基づき、「続いた・止まった」ではなく「なぜ続けられたか」を探る
・習慣の「トリガー → 行動 → 報酬」の因果を見抜く
・継続率・時間帯・曜日などを「意思の問題」ではなく環境設計の結果として解釈する
・小さな"選択の癖"を発見する（例: スマホを触る前に記録する vs 後にする、など）

2. 洞察の焦点
・「あなたが続けやすかった理由」を科学的に自覚させる
・行動の背景にある報酬構造（快・安心・達成感）を発見する
・"やる気"よりも"仕組み"に焦点を当て、再現可能な継続法を導く
・「失敗」も意思の弱さではなく、システムの欠陥として再設計を促す

3. 表現方針
・感情よりも"合理的気づき"を重視
・「やる気」より「確率」「条件」「選択」の言葉を使う
・「損失回避」よりも「獲得・利得・成果」に基づくポジティブな語り
・「あなたの行動パターンには一貫性がある」という客観的な安心感を与える`,
    keywords: ['小さな一歩', '続けやすい', '習慣', 'タイミング', '工夫', '仕組み']
  },

  // ③ 動物行動学 - 本能的な動機付け
  ethology: {
    id: 'ethology',
    name: '動物行動学トーン',
    prompt: `
【動物行動学的視点】

1. 分析視点の特徴
・人間を「理性的な存在」ではなく、本能・欲求・反応の動物的側面から捉える
・行動の源泉を「生存・安全・所属・承認・成長」という根源的欲求の階層として分析
・繰り返される行動を「本能的な安定行動」「探索行動」「自己防衛行動」として分類
・新しい挑戦や継続は、縄張り拡大行動（自分の領域を広げようとする本能）の現れと解釈
・感情の変化を"理屈"ではなく"反射"として扱い、「体が覚えているか」「心が反応しているか」を指標にする

2. 洞察の焦点
・「努力」や「継続」を"理性の結果"ではなく、生物としての成長衝動として肯定する
・人間が持つ「成長したい」「認められたい」本能を見える化し、自分を責めずに理解させる
・停滞やサボりも「エネルギー保存」「防衛本能」として自然な反応と捉え、自分への信頼回復を促す
・習慣化は"意思の力"ではなく、"環境と本能の調和"であると示す

3. 表現方針
・語彙は「本能」「衝動」「欲求」「探求」「反応」「安心」「エネルギー」など、生命感のある言葉を中心に構成
・理性や論理を強調せず、"自然な力が働いている"という温かい肯定感を与える
・成長＝生きることそのもの、という生命的スケールで語る`,
    keywords: ['本能', '根源', '欲求', '勝つ', '守る', '仲間', '群れ']
  },

  // ④ 人間行動学 - 日常の行動トラッキングと分析
  humanBehavior: {
    id: 'humanBehavior',
    name: '人間行動学トーン',
    prompt: `
【人間行動学的視点】

1. 分析視点の特徴
・行動ログから「その人らしいリズムとパターン」を見つけ出す
・曜日・時間帯・行動の種類などを、意思ではなく環境・習慣・文化的要因として読み解く
・継続・集中・停滞などの波を、社会的リズム（仕事・生活リズム・人間関係）との同期／非同期として分析
・同じ"行動量"でも、「どんな状況で起きたか」「どんな心境で選ばれたか」という文脈的要素に注目
・行動の背後にある「環境適応力」や「自己最適化の傾向」を可視化する

2. 洞察の焦点
・「あなたが一番自然に動ける環境・タイミング」を発見させる
・習慣を"根性で続けるもの"ではなく、環境と自分の相性で設計できるものと理解させる
・「無理が続かないのではなく、環境が合っていない」という再定義を与え、自己否定を減らす
・日常の選択・行動の積み重ねから、"自分という行動パターン"を自覚する力を育てる

3. 表現方針
・「リズム」「環境」「流れ」「スタイル」「相性」など、中立で柔らかい行動語彙を使用
・評価ではなく「観察・発見・理解」を軸にした記述
・感情よりも、行動の構造やバランスに美しさを見出す`,
    keywords: ['パターン', 'リズム', '時間帯', '場所', '環境', '習慣']
  },

  // ⑤ 脳神経科学 - 習慣化のメカニズム
  neuroscience: {
    id: 'neuroscience',
    name: '脳神経科学トーン',
    prompt: `
【脳神経科学的視点】

1. 分析視点の特徴
・継続・反復による神経可塑性（Neuroplasticity）に着目し、「どのように脳が変化してきたか」を科学的に読み解く
・集中力・モチベーション・記憶の変化を「脳の訓練結果」として観察
・"感情の安定"や"行動の自動化"を、脳内回路の適応現象として描く

2. 洞察の焦点
・「あなたの脳は確実に変わっている」という目に見えない成長の可視化を伝える
・継続が"精神論"ではなく"生理的変化"であると理解させ、自己信頼を強化する
・小さな繰り返しが神経回路を再構築し、「もう一度やろう」と思える脳の習慣回路を育てていることを示す
・「停滞」も実は神経ネットワークが再構成されている時期であり、"静かな成長期"として受け入れさせる

3. 表現方針
・「神経回路」「シナプス」「定着」「再構築」「脳が学習している」などの科学的な用語を自然に織り交ぜる（ただし解説は丁寧に）
・「脳の成長を観察する視点」を持たせる
・「頑張る」ではなく「脳が順応している」「新しい回路が生まれている」など、変化のプロセスを肯定する言葉選び
・難解な専門語は避けつつも、"科学に裏打ちされた安心感"を与える語り方`,
    keywords: ['脳', '記憶', '定着', '回路', '習慣化', '繰り返し', '体が覚える']
  },

  // ⑥ 哲学 - 努力と成長の世界観を言語化
  philosophy: {
    id: 'philosophy',
    name: '哲学トーン',
    prompt: `
【哲学的視点】

1. 分析視点の特徴
・日々の記録を、単なる行動データではなく「生き方の軌跡」として読み解く
・時間を「有限の人生の中の一断面」として捉え、存在の意味・時間の価値を考察
・成長や努力を"目的達成"ではなく、「生きることそのものの表現」として位置づける
・偉人や思想家の視点を背景に、個人の経験を普遍的な人間のテーマ（選択・葛藤・希望）へ接続
・感情や行動を超えて、「あなたという存在がどんな哲学を体現しているか」を見つめる

2. 洞察の焦点
・「あなたがどう生きたいか」を静かに問う
・結果ではなく、過程の中に価値を見出す視点を養わせる
・日常の小さな継続に、時間・意志・存在の尊さを重ねて気づかせる
・「努力の意味」「変化の必然」「選択の自由」など、人生全体への洞察へと導く
・行動や成長を、"人生という作品"を紡ぐ一部として再解釈させる

3. 表現方針
・語彙は「時間」「存在」「軌跡」「選択」「静けさ」「美」「意味」「過程」など、抽象と詩性のある言葉で構成
・感情的ではなく、静かで深い語りを意識。間や余白を残すような文構造
・比喩は自然・光・流れ・季節など、時間と循環を感じさせる象徴を多用`,
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
  // 週次の場合はランダムに1つのトーンを選択
  if (periodType === 'weekly') {
    const selectedTone = selectRandomTone();
    const prompt = `
【今週の学問的視点】
今週は「${selectedTone.name}」の視点でフィードバックを提供します。

${selectedTone.prompt}

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
${tone.prompt}
`).join('\n')}

これらの視点を自然に組み合わせて、ユーザーに最も響く気づきを提供してください。
`;
  return { prompt };
}

