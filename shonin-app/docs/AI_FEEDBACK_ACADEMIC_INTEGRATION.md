# AI Feedback - 学問的統合モデル

## 📚 概要

Shoninの理念である「心理学・行動経済学・動物行動学・人間行動学・脳神経科学・哲学」の6つの学問領域を統合したAIフィードバックシステムの実装ドキュメント。

---

## 🎯 理念

**「異なる角度から人間を照らすライト」**

各学問領域を独立した視点として捉え、それらを統合することで立体的な人間理解に基づくプロダクトを実現する。

---

## 📖 6つの学問領域とアプリへの活用

### 1. 心理学 (Psychology)
**役割**: 継続できるUIやフィードバック設計

- ログデータから心理状態（自己効力感、内発的動機付け）を推定
- 感情の変化やモチベーションの波を理解
- 例: "今日は行動量が減っているけど、これは自然な波です。次の小さな行動を決めよう"

**キーワード**: 気持ち、心、やる気、自信、感情、波、自然、無理なく

---

### 2. 行動経済学 (Behavioral Economics)
**役割**: 報酬・リマインド・選択設計

- ナッジ理論で「行動しやすい小さな一歩」を提示
- 習慣形成のメカニズム: トリガー→行動→報酬
- 例: "目標を半分に分けて、今日だけ達成を狙おう"

**キーワード**: 小さな一歩、続けやすい、習慣、タイミング、工夫、仕組み

---

### 3. 動物行動学 (Ethology)
**役割**: 本能的な動機付け（競争・共感・所属）

- 競争心・承認欲求・仲間意識などの本能を活かす
- 人間の根源的な欲求に基づくメッセージ
- 例: "あなたの継続は、群れのリーダーのように周りに影響を与えています"

**キーワード**: 本能、根源、欲求、勝つ、守る、仲間、群れ

---

### 4. 人間行動学 (Human Behavior Science)
**役割**: 日常の行動トラッキングと分析ロジック

- 時間帯・曜日・場所などの環境要因と行動の関係を分析
- 行動パターンの発見
- 例: "水曜日は集中しやすい日。金曜は休息モード。このリズムがあなたのスタイルですね"

**キーワード**: パターン、リズム、時間帯、場所、環境、習慣

---

### 5. 脳神経科学 (Neuroscience)
**役割**: 習慣化のメカニズム（ドーパミン・報酬系）

- 習慣回路と神経可塑性の観点から説明
- 科学的根拠で信頼性と納得感を強化
- 例: "1ヶ月の継続で、脳内に新しい神経回路ができ始めています。これが習慣化の証です"

**注意**: 専門用語は使わず、「脳の働き」「記憶の定着」など平易な表現で

**キーワード**: 脳、記憶、定着、回路、習慣化、繰り返し、体が覚える

---

### 6. 哲学 (Philosophy)
**役割**: 「努力とは何か」「成長とは何か」という世界観の言語化

- 日々の行動に意味や存在価値を与える
- 偉人の言葉を適切なタイミングで引用（将来実装）
- 例: "あなたの努力は他人に見えなくても、確かに時間の中に刻まれています"

**キーワード**: 意味、価値、存在、人生、時間、積み重ね、尊い、確かに

---

## 🛠️ 実装構成

### ファイル構成

```
lib/
├── ai-feedback-tones.ts          # 学問的トーン定義
├── quotes-selector.ts            # 名言選択システム
├── session-analyzer.ts           # 【層①】ローデータ解析エンジン
└── prompt-generator.ts           # 【層②】プロンプト生成エンジン

data/
└── quotes.json                   # 120個の偉人の名言（日英バイリンガル）

app/api/ai/
└── analyze-sessions/
    └── route.ts                  # AIフィードバック生成API（層①②を統合）
```

### 主要な関数

#### 1. `FEEDBACK_TONES`
6つの学問領域ごとのトーン定義

```typescript
export const FEEDBACK_TONES: Record<string, FeedbackTone> = {
  psychology: { ... },
  behavioral: { ... },
  ethology: { ... },
  humanBehavior: { ... },
  neuroscience: { ... },
  philosophy: { ... }
}
```

#### 2. `generateAcademicPrompt()`
6つの学問的視点すべてを統合してプロンプトを生成

```typescript
generateAcademicPrompt(periodType: 'weekly' | 'monthly'): string
```

週次・月次に応じて、各学問領域の適切なプロンプトを組み合わせます。

#### 3. `selectQuoteForContext()`
コンテキストに基づいて最適な名言を選択

```typescript
selectQuoteForContext(context: QuoteSelectionContext): Quote | null
```

セッション数、総時間、気分、テーマなどから最適な名言を自動選択します。

#### 4. `formatQuoteSimple()`
名言を読みやすい形式でフォーマット

```typescript
formatQuoteSimple(quote: Quote, locale: 'ja' | 'en'): string
```

名言と著者名をシンプルに整形します。

#### 5. `analyzeSessionData()` 【層①】
ローデータを構造化データに変換

```typescript
analyzeSessionData(
  sessions: RawSessionData[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string
): AnalyzedSessionData
```

Supabaseから取得したセッションデータを分析し、プロンプト生成に最適な構造化データに変換します。

#### 6. `generatePrompts()` 【層②】
構造化データからプロンプトを生成

```typescript
generatePrompts(
  analyzedData: AnalyzedSessionData,
  config: PromptGenerationConfig
): GeneratedPrompts
```

構造化データから、学問的視点と名言を統合した高品質なAIプロンプトを生成します。

---

## 📋 実装状況

### ✅ 完了: 学問的統合モデルの実装
- [x] `ai-feedback-tones.ts`の作成
- [x] 6つの学問領域のトーン定義
  - 心理学、行動経済学、動物行動学、人間行動学、脳神経科学、哲学
- [x] `analyze-sessions/route.ts`への統合
- [x] 週次・月次別のプロンプト設計
- [x] `generateAcademicPrompt()`による6つの視点の統合

### ✅ 完了: 偉人の名言統合システム
- [x] `data/quotes.json`の配置（120個の名言、日英バイリンガル）
- [x] `quotes-selector.ts`の作成
- [x] コンテキストベースの名言選択ロジック
- [x] AIフィードバックへの自然な統合
- [x] **トーン連動の名言選択機能**: 週次フィードバックで選ばれた学問的トーンと同じ分野の名言を自動選択
- [x] **コンテキストベースのトーン選択**: ユーザーのセッションデータを分析して最適な学問的トーンを自動選択（案1実装）

### ✅ 完了: 2層構造の実装
- [x] 層①: `session-analyzer.ts`（ローデータ解析エンジン）
  - Supabaseのセッションデータを構造化データに変換
  - 行動パターン分析（時間帯、曜日、場所、継続性）
  - 気分トレンド分析
  - 目標別進捗計算
- [x] 層②: `prompt-generator.ts`（プロンプト生成エンジン）
  - 構造化データから学問的視点と名言を統合したプロンプト生成
  - システムプロンプトとユーザープロンプトの分離
  - 再利用可能で保守性の高い設計

---

## 🎨 使用例

### 学問的トーンの使用

```typescript
import { generateAcademicPrompt } from '@/lib/ai-feedback-tones';

// 週次フィードバック用のプロンプト生成
// 6つすべての学問的視点を統合したプロンプトを生成
const weeklyPrompt = generateAcademicPrompt('weekly');

// 月次フィードバック用のプロンプト生成
const monthlyPrompt = generateAcademicPrompt('monthly');
```

### 名言選択システムの使用

#### コンテキストベースのトーン選択（週次フィードバック）

週次フィードバックでは、**ユーザーのセッションデータを分析**して最適な学問的トーンを自動選択し、そのトーンと**同じ分野**の名言を選びます。

```typescript
import { selectToneByContext, type ToneSelectionContext } from '@/lib/ai-feedback-tones';
import { selectQuoteByTone, formatQuoteSimple } from '@/lib/quotes-selector';

// セッションデータから最適なトーンを選択
const toneContext: ToneSelectionContext = {
  sessionsCount: 8,
  totalHours: 15.5,
  consistency: 0.75,
  moodTrend: 'improving',
  averageMood: 4.2,
  hasReflections: true,
  topActivitiesCount: 3,
  goalAchievementRate: 0.8
};

const selectedTone = selectToneByContext(toneContext);
// => { id: "behavioralEconomics", name: "行動経済学", ... }
// セッション数が多く、継続性が高いため「習慣形成」に焦点を当てた行動経済学が選ばれる

// 選ばれたトーンと同じ分野の名言を選択
const quote = selectQuoteByTone(
  selectedTone.id,  // "behavioralEconomics"
  'ja',
  8,   // sessionCount
  15.5 // totalHours
);

if (quote) {
  const formattedQuote = formatQuoteSimple(quote, 'ja');
  // => "人間は習慣の生き物である。― アリストテレス（ニコマコス倫理学）"
}
```

**トーン選択ロジック:**

セッションデータの各指標から、各学問領域へのスコアを計算し、最も適したトーンを選択します。

1. **行動経済学** - 継続性が高い（>0.7）+ セッション数が多い（≥5） → 習慣形成に焦点
2. **心理学** - 気分トレンドが下降 or 平均気分が低い（<3） → 感情サポートに焦点
3. **脳神経科学** - 1セッションの平均時間が長い（>2h） or 総時間が多い（>15h） → 集中力に焦点
4. **哲学** - 目標達成率が高い（>0.7） or 総時間が非常に多い（>20h） → 成長の意味付けに焦点
5. **人間行動学** - リフレクションあり + 多様な活動（>3種類） → 自己理解に焦点
6. **動物行動学** - 継続性が非常に高い（>0.8） + 特定活動に集中 → 本能的な行動パターンに焦点

**名言の対応表:**
- `psychology` → `psych_` プレフィックスの名言
- `behavioralEconomics` → `behav_` プレフィックスの名言
- `ethology` → `etho_` プレフィックスの名言
- `humanBehavior` → `human_` プレフィックスの名言
- `neuroscience` → `neuro_` プレフィックスの名言
- `philosophy` → `phil_` プレフィックスの名言

#### コンテキストベースの名言選択（月次フィードバック）

```typescript
import { selectQuoteForContext, formatQuoteSimple, type QuoteSelectionContext } from '@/lib/quotes-selector';

// コンテキストを設定
const context: QuoteSelectionContext = {
  periodType: 'monthly',
  locale: 'ja',
  sessionCount: 30,
  totalHours: 60,
  mood: 'positive',
  primaryTheme: 'growth'
};

// 最適な名言を選択
const quote = selectQuoteForContext(context);

// フォーマットして使用
if (quote) {
  const formattedQuote = formatQuoteSimple(quote, 'ja');
  // => "私たちは、繰り返し行うことの総体である。ゆえに卓越とは行為ではなく習慣である。― Will Durant（アリストテレスの解釈）"
}
```

### 2層構造の使用

```typescript
import { analyzeSessionData, type RawSessionData } from '@/lib/session-analyzer';
import { generatePrompts, type PromptGenerationConfig } from '@/lib/prompt-generator';

// 【層①】ローデータを構造化データに変換
const analyzedData = analyzeSessionData(
  sessions as RawSessionData[],
  'weekly',
  '2025-01-01',
  '2025-01-07'
);

// 【層②】構造化データからプロンプトを生成
const config: PromptGenerationConfig = {
  locale: 'ja',
  attempt: 1,
  pastFeedbacksCount: 0
};

const { systemPrompt, userPrompt, maxTokens, inspirationalQuote } = generatePrompts(analyzedData, config);

// OpenAI APIにリクエスト
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  }),
});
```

### 実際の使用場所

`app/api/ai/analyze-sessions/route.ts`の`generateAIFeedback()`関数内で：
1. **層①**: `analyzeSessionData()` - セッションデータを構造化
2. **層②**: `generatePrompts()` - プロンプトを生成（学問的視点 + 名言統合）
3. OpenAI APIにリクエスト
4. AIが自然にフィードバックを返す

---

## 💡 設計思想

### なぜ6つの学問領域なのか？

1. **多角的な人間理解**
   - 心理学: なぜ人はそう考えるか・感じるか
   - 行動経済学: 理屈ではなく実際にどう行動するか
   - 脳科学: 思考や感情がどのように生まれるか
   - 社会学: 個人を取り巻く社会構造や文化の影響
   - 哲学: 人間とは何か

2. **統合による深み**
   - 単なるデータ分析やUI改善ではない
   - 「なぜ人は行動を続けられないのか」「どうすれば内側から変われるのか」という人間理解の深さがサービスの本質

3. **専門用語を使わない配慮**
   - 学問的には深いが、ユーザーには平易な言葉で届ける
   - 「メタ認知」→「自分を客観的に見る」
   - 「認知的負荷」→「頭の疲れ」

4. **偉人の言葉の力**
   - 120個の厳選された名言（日英バイリンガル）
   - 6つの学問領域に対応した分類
   - コンテキストに応じた自動選択
   - AIが自然にフィードバックに織り込む

5. **2層構造の利点**
   - **層①（データ解析）**: ローデータを再利用可能な構造化データに変換
     - テスト可能
     - 他の機能でも利用可能（ダッシュボード、レポートなど）
     - データ分析ロジックの一元管理
   - **層②（プロンプト生成）**: プロンプト生成ロジックの分離
     - 学問的視点の調整が容易
     - 名言の統合方法の変更が容易
     - プロンプトテンプレートの A/B テストが可能

---

## 📝 注意事項

### 専門用語の使用禁止リスト

❌ **使用禁止**:
- メタ認知
- 認知的負荷
- フロー状態
- 認知バイアス
- 神経可塑性（専門的文脈では）
- ドーパミン（専門的文脈では）

✅ **代わりに使う**:
- 自分を客観的に見る
- 頭の疲れ
- 集中状態
- 思い込み
- 脳の成長
- やる気物質

---

**Created**: 2025-11-04
**Version**: 2.0.0
**Status**: 学問的統合モデル + 偉人の名言システム実装完了

## 🎉 v2.0.0 新機能

### 偉人の名言統合システム
- 120個の厳選された名言（Aristotle, Marcus Aurelius, Seneca, Laozi, Carl Jung, James Clear, Daniel Kahneman など）
- 6つの学問領域に完全対応（philosophy, psych, behavEcon, humanBehav, ethology, neuro）
- 日英バイリンガル完全対応
- コンテキストベースの自動選択（セッション数、総時間、気分、テーマに応じて最適化）
- AIフィードバックへの自然な統合

