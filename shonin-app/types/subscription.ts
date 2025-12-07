/**
 * サブスクリプション関連の型定義
 * プラン追加時はここを更新するだけでOK
 */

// プランタイプの定義（将来的な拡張に対応）
export type PlanType = 'free' | 'standard' | 'premium';

// プランの階層レベル（アップグレード/ダウングレード判定用）
export const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  standard: 1,
  premium: 2,
} as const;

// 課金サイクルの型
export type BillingCycle = 'monthly' | 'yearly';

// Stripe Price IDとプランタイプのマッピング
export const PRICE_ID_TO_PLAN: Record<string, PlanType> = {
  'price_1SELBSIaAOyL3ERQzh3nDxnr': 'standard', // 月額
  'price_1SabtaIaAOyL3ERQmoX2SwRo': 'standard', // 年額
  // プレミアムプラン追加時はここに追加
  // 'price_xxxxxxxxxxxxxxxxxxxxx': 'premium',
} as const;

// プランタイプ・課金サイクル別のStripe Price ID
export const PLAN_PRICE_IDS: Record<Exclude<PlanType, 'free'>, Record<BillingCycle, string>> = {
  standard: {
    monthly: 'price_1SELBSIaAOyL3ERQzh3nDxnr',
    yearly: 'price_1SabtaIaAOyL3ERQmoX2SwRo',
  },
  premium: {
    monthly: '', // 未実装
    yearly: '',  // 未実装
  },
} as const;

// プランタイプからStripe Price IDへの逆マッピング（月額のデフォルト値）
// Partialを使って未実装のプランをオプショナルに
export const PLAN_TO_PRICE_ID: Partial<Record<Exclude<PlanType, 'free'>, string>> = {
  standard: 'price_1SELBSIaAOyL3ERQzh3nDxnr',
  // プレミアムプラン追加時はここに追加
  // premium: 'price_xxxxxxxxxxxxxxxxxxxxx',
} as const;

/**
 * Price IDからプランタイプを取得
 * @param priceId - Stripe Price ID
 * @returns プランタイプ（不明な場合はnull）
 */
export function getPlanTypeFromPriceId(priceId: string): PlanType | null {
  return PRICE_ID_TO_PLAN[priceId] || null;
}

/**
 * プランタイプからPrice IDを取得
 * @param planType - プランタイプ
 * @returns Stripe Price ID（Freeプランまたは未実装プランの場合はnull）
 */
export function getPriceIdFromPlanType(planType: Exclude<PlanType, 'free'>): string | null {
  return PLAN_TO_PRICE_ID[planType] ?? null;
}

/**
 * プランの比較（アップグレード/ダウングレード判定）
 * @param currentPlan - 現在のプラン
 * @param targetPlan - 目標のプラン
 * @returns 'upgrade' | 'downgrade' | 'same'
 */
export function comparePlans(currentPlan: PlanType, targetPlan: PlanType): 'upgrade' | 'downgrade' | 'same' {
  const currentLevel = PLAN_HIERARCHY[currentPlan];
  const targetLevel = PLAN_HIERARCHY[targetPlan];
  
  if (currentLevel < targetLevel) return 'upgrade';
  if (currentLevel > targetLevel) return 'downgrade';
  return 'same';
}

// プランごとの機能制限
export const PLAN_LIMITS = {
  free: {
    maxGoals: 1,
    maxActivities: 3,
    hasAIFeedback: false,
    hasPastCalendar: false,
    hasAdvancedAnalytics: false,
  },
  standard: {
    maxGoals: 3,
    maxActivities: 3,
    hasAIFeedback: true,
    hasPastCalendar: true,
    hasAdvancedAnalytics: false,
  },
  premium: {
    maxGoals: Infinity,
    maxActivities: Infinity,
    hasAIFeedback: true,
    hasPastCalendar: true,
    hasAdvancedAnalytics: true,
  },
} as const;

/**
 * プランの機能制限を取得
 * @param planType - プランタイプ
 * @returns プランの機能制限
 */
export function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

/**
 * 機能へのアクセス権限チェック
 * @param planType - プランタイプ
 * @param feature - チェックする機能
 * @returns アクセス可能かどうか
 */
export function canAccessFeature(
  planType: PlanType,
  feature: keyof typeof PLAN_LIMITS.free
): boolean {
  const limits = PLAN_LIMITS[planType];
  const value = limits[feature];
  
  // booleanの場合はそのまま返す
  if (typeof value === 'boolean') return value;
  
  // Infinityの場合はtrue
  if (value === Infinity) return true;
  
  // それ以外（数値）はtrue（実際の数チェックは別途行う）
  return true;
}

// サブスクリプション情報の型
export interface SubscriptionInfo {
  subscriptionStatus: PlanType;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
}

