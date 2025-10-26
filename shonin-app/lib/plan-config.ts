export interface PlanFeature {
  label: string;
  free: string | boolean;
  standard: string | boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceLabel: string;
  priceId: string; // Stripe Price ID
  features: string[];
  isCurrent: boolean;
  buttonText: string;
  buttonVariant: "outline" | "default";
  isPopular?: boolean;
}

// プランの階層を定義（将来のpremiumプラン対応）
const PLAN_HIERARCHY = {
  free: 0,
  standard: 1,
  premium: 2, // 将来対応
};

/**
 * ユーザーの現在のプランに基づいて、プランの設定を動的に生成
 * @param userPlan - ユーザーの現在のプラン ('free' | 'standard' | 'premium')
 * @returns 各プランの設定（isCurrent, buttonText, buttonVariant を含む）
 */
export function getPlanConfigs(userPlan: 'free' | 'standard' | 'premium' = 'free') {
  const userPlanLevel = PLAN_HIERARCHY[userPlan];

  return [
    {
      id: "free",
      name: "free",
      price: "$0",
      priceLabel: "per_month",
      priceId: "", // Freeプランなので不要
      features: [],
      isCurrent: userPlan === 'free',
      buttonText: userPlan === 'free' 
        ? 'current_plan' 
        : userPlanLevel > PLAN_HIERARCHY.free 
          ? 'downgrade' 
          : 'manage_subscription',
      buttonVariant: 'outline' as "outline" | "default",
      isPopular: false,
    },
    {
      id: "standard",
      name: "standard", 
      price: "$9.99",
      priceLabel: "per_month",
      priceId: "price_1SELBSIaAOyL3ERQzh3nDxnr",
      features: [],
      isCurrent: userPlan === 'standard',
      buttonText: userPlan === 'standard' 
        ? 'current_plan' 
        : userPlanLevel > PLAN_HIERARCHY.standard 
          ? 'downgrade' 
          : 'upgrade',
      buttonVariant: 'default' as "outline" | "default",
      isPopular: true,
    },
    // 将来的にpremiumプランを追加する場合はここに追加
  ];
}

export const planConfig = {
  plans: getPlanConfigs('free'), // デフォルトはfree
  
  featureComparison: [
    {
      label: "features.activity_label",
      free: "features.up_to_3",
      standard: "features.unlimited",
    },
    {
      label: "features.goal_label", 
      free: "features.up_to_3_goals",
      standard: "features.unlimited",
    },
    {
      label: "features.calendar_label",
      free: "features.current_month_only",
      standard: "features.all_days",
    },
    {
      label: "features.ai_label",
      free: false,
      standard: true,
    },
  ]
};
