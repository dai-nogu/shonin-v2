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

export const planConfig = {
  plans: [
    {
      id: "free",
      name: "free",
      price: "$0",
      priceLabel: "",
      priceId: "price_1SELAcIaAOyL3ERQxdk24Xyu", 
      features: [
        "features.activity_limit",
        "features.goal_limit", 
        "features.no_past_calendar",
        "features.no_ai"
      ],
      isCurrent: true,
      buttonText: "current_plan",
      buttonVariant: "outline" as const,
    },
    {
      id: "standard",
      name: "standard", 
      price: "$9.99",
      priceLabel: "per_month",
      priceId: "price_1SELBSIaAOyL3ERQzh3nDxnr",
      features: [
        "features.unlimited_activities",
        "features.unlimited_goals",
        "features.full_calendar", 
        "features.ai_feedback"
      ],
      isCurrent: false,
      buttonText: "upgrade",
      buttonVariant: "default" as const,
      isPopular: true,
    },
  ],
  
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
