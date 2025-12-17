import { PlanType, PLAN_PRICE_IDS } from '@/types/subscription';

export interface PlanFeature {
  label: string;
  free?: string | boolean;
  starter: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: string;
  priceLabel: string;
  priceId: string; // Stripe Price ID
  yearlyPrice?: string; // 年額価格
  yearlyPriceLabel?: string; // 年額ラベル
  yearlyPriceId?: string; // 年額のStripe Price ID
  yearlySavings?: string; // 年額の割引率
  features: string[];
  isCurrent: boolean;
  buttonText: string;
  buttonVariant: "outline" | "default";
  isPopular?: boolean;
}

/**
 * ユーザーの現在のプランに基づいて、プランの設定を動的に生成
 * @param userPlan - ユーザーの現在のプラン
 * @returns 各プランの設定（isCurrent, buttonText, buttonVariant を含む）
 */
export function getPlanConfigs(userPlan: PlanType = 'free'): Plan[] {
  const getButtonText = (planId: PlanType): string => {
    // 現在のプランと同じ場合
    if (userPlan === planId) {
      return 'current_plan';
    }
    
    // Freeユーザーの場合は「無料で始める」（チェックアウトフロー）
    if (userPlan === 'free') {
      return 'start_free';
    }
    
    // 有料プランユーザーの場合は「プラン変更」（ビリングポータル）
    return 'change_plan';
  };

  const plans: Plan[] = [
    {
      id: "starter",
      name: "starter",
      price: "$3.99",
      priceLabel: "per_month",
      priceId: PLAN_PRICE_IDS.starter.monthly,
      features: [],
      isCurrent: userPlan === 'starter',
      buttonText: getButtonText('starter'),
      buttonVariant: 'outline' as const,
      isPopular: false,
    },
    {
      id: "standard",
      name: "standard", 
      price: "$6.99",
      priceLabel: "per_month",
      priceId: PLAN_PRICE_IDS.standard.monthly,
      yearlyPrice: "$69",
      yearlyPriceLabel: "per_year",
      yearlyPriceId: PLAN_PRICE_IDS.standard.yearly,
      features: [],
      isCurrent: userPlan === 'standard',
      buttonText: getButtonText('standard'),
      buttonVariant: 'default' as const,
      isPopular: true,
    },
    {
      id: "premium",
      name: "premium",
      price: "$9.99",
      priceLabel: "per_month",
      priceId: PLAN_PRICE_IDS.premium.monthly,
      yearlyPrice: "$99",
      yearlyPriceLabel: "per_year",
      yearlyPriceId: PLAN_PRICE_IDS.premium.yearly,
      features: [],
      isCurrent: userPlan === 'premium',
      buttonText: getButtonText('premium'),
      buttonVariant: 'default' as const,
      isPopular: false,
    },
  ];

  return plans;
}

export const planConfig = {
  plans: getPlanConfigs('free'), // デフォルトはfree

  featureComparison: [
    {
      label: "features.goal_label",
      free: false,
      starter: "features.up_to_1",
      standard: "features.up_to_3",
      premium: "features.unlimited",
    },
    {
      label: "features.calendar_label",
      free: "features.recent_1_week",
      starter: "features.current_month_only",
      standard: "features.all_days",
      premium: "features.all_days",
    },
    {
      label: "features.ai_label",
      free: false,
      starter: "features.first_month_only",
      standard: "features.monthly_once",
      premium: "features.weekly_and_monthly",
    },
  ]
};
