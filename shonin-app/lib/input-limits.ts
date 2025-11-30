/**
 * 入力文字数制限の共通定義
 * 
 * フロントエンド（UI表示・バリデーション）とバックエンド（サニタイゼーション）
 * の両方で使用される共通の制限値を定義
 * 
 * 英語は日本語の約4倍の文字数を許容（同じ情報量を表現するため）
 */

export interface InputLimits {
  /** 場所 */
  location: number;
  /** アクティビティ名 */
  activityName: number;
  /** 目標タイトル */
  goalTitle: number;
  /** 目標の理由（motivation） */
  goalMotivation: number;
  /** セッション振り返り（achievements） */
  sessionAchievements: number;
  /** 明日の予定（challenges） */
  sessionChallenges: number;
  /** その他（notes） */
  sessionNotes: number;
}

/**
 * 日本語の文字数制限
 */
export const JA_INPUT_LIMITS: InputLimits = {
  location: 30,
  activityName: 50,
  goalTitle: 30,
  goalMotivation: 150,
  sessionAchievements: 500,
  sessionChallenges: 500,
  sessionNotes: 500,
};

/**
 * 英語の文字数制限（日本語の約4倍）
 */
export const EN_INPUT_LIMITS: InputLimits = {
  location: 120,
  activityName: 200,
  goalTitle: 120,
  goalMotivation: 600,
  sessionAchievements: 2000,
  sessionChallenges: 2000,
  sessionNotes: 2000,
};

/**
 * 言語に応じた文字数制限を取得
 */
export function getInputLimits(locale: string): InputLimits {
  return locale === 'en' ? EN_INPUT_LIMITS : JA_INPUT_LIMITS;
}

/**
 * AI呼び出し時の集約後制限（複数セッションのデータを集約した後の制限）
 */
export interface AggregatedLimits {
  weekly: number;
  monthly: number;
}

export const JA_AGGREGATED_LIMITS: AggregatedLimits = {
  weekly: 3000,   // 週次: 最大3セッション分程度
  monthly: 5000,  // 月次: 最大5セッション分程度
};

export const EN_AGGREGATED_LIMITS: AggregatedLimits = {
  weekly: 12000,
  monthly: 20000,
};

export function getAggregatedLimits(locale: string): AggregatedLimits {
  return locale === 'en' ? EN_AGGREGATED_LIMITS : JA_AGGREGATED_LIMITS;
}

// =========================================
// サーバー側サニタイゼーション関数
// =========================================

/**
 * サーバー側での入力制限（UIバイパス対策）
 * 
 * フロントエンドのmaxLengthがDevToolsで回避されても、
 * DBには制限内のデータしか保存されないことを保証
 * 
 * @param input - 入力文字列
 * @param maxLength - 最大文字数
 * @returns 切り詰められた文字列、または null
 */
export function truncateForDb(input: string | null | undefined, maxLength: number): string | null {
  if (!input) return null;
  return input.slice(0, maxLength);
}

/**
 * 必須フィールド用の切り詰め関数（null不可）
 * 
 * @param input - 入力文字列
 * @param maxLength - 最大文字数
 * @returns 切り詰められた文字列（空文字の場合も空文字を返す）
 */
export function truncateRequiredForDb(input: string | null | undefined, maxLength: number): string {
  if (!input) return '';
  return input.slice(0, maxLength);
}

