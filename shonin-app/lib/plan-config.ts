import { PlanType, PLAN_HIERARCHY, PLAN_TO_PRICE_ID } from '@/types/subscription';

export interface PlanFeature {
  label: string;
  free: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

export interface Plan {
  id: PlanType;
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

/**
 * ユーザーの現在のプランに基づいて、プランの設定を動的に生成
 * @param userPlan - ユーザーの現在のプラン
 * @returns 各プランの設定（isCurrent, buttonText, buttonVariant を含む）
 */
export function getPlanConfigs(userPlan: PlanType = 'free'): Plan[] {
  const userPlanLevel = PLAN_HIERARCHY[userPlan];

  const plans: Plan[] = [
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
      buttonVariant: 'outline' as const,
      isPopular: false,
    },
    {
      id: "standard",
      name: "standard", 
      price: "$9.99",
      priceLabel: "per_month",
      priceId: PLAN_TO_PRICE_ID.standard,
      features: [],
      isCurrent: userPlan === 'standard',
      buttonText: userPlan === 'standard' 
        ? 'current_plan' 
        : userPlanLevel > PLAN_HIERARCHY.standard 
          ? 'downgrade' 
          : 'upgrade',
      buttonVariant: 'default' as const,
      isPopular: true,
    },
    // プレミアムプラン（将来リリース予定）
    // {
    //   id: "premium",
    //   name: "premium",
    //   price: "$19.99",
    //   priceLabel: "per_month",
    //   priceId: PLAN_TO_PRICE_ID.premium,
    //   features: [],
    //   isCurrent: userPlan === 'premium',
    //   buttonText: userPlan === 'premium'
    //     ? 'current_plan'
    //     : userPlanLevel > PLAN_HIERARCHY.premium
    //       ? 'downgrade'
    //       : 'upgrade',
    //   buttonVariant: 'default' as const,
    //   isPopular: false,
    // },
  ];

  return plans;
}

export const planConfig = {
  plans: getPlanConfigs('free'), // デフォルトはfree
  
  featureComparison: [
    {
      label: "features.activity_label",
      free: "features.up_to_3",
      standard: "features.unlimited",
      premium: "features.unlimited",
    },
    {
      label: "features.goal_label", 
      free: "features.up_to_1",
      standard: "features.up_to_3",
      premium: "features.unlimited",
    },
    {
      label: "features.calendar_label",
      free: "features.current_month_only",
      standard: "features.all_days",
      premium: "features.all_days",
    },
    {
      label: "features.ai_label",
      free: false,
      standard: true,
      premium: true,
    },
    // プレミアムプラン専用機能（将来追加予定）
    // {
    //   label: "features.advanced_analytics_label",
    //   free: false,
    //   standard: false,
    //   premium: true,
    // },
  ]
};
