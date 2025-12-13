"use client";

import { useTranslations } from "next-intl";
import { getPlanConfigs } from "@/lib/plan-config";
import { useActionState, useState } from "react";
import { createStripeSession } from "@/app/actions/stripe";
import type { PlanType, BillingCycle } from "@/types/subscription";
import { safeError } from "@/lib/safe-logger";
import { PlanCard } from "./plan/plan-card";

type ActionState = {
  status: string;
  error: string;
  redirectUrl?: string;
};

const initialState: ActionState = {
  status: "idle",
  error: "",
};

interface PlanPageClientProps {
  userPlan: PlanType;
}

export default function PlanPageClient({ userPlan }: PlanPageClientProps) {
  const t = useTranslations("plan");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  
  const [state, formAction, isPending] = useActionState(async (prevState: ActionState, formData: FormData) => {
    const result = await createStripeSession(prevState, formData);
    
    if (result.status === "error") {
      return {
        status: "error",
        error: result.error,
        redirectUrl: "",
      };
    } else if (result.status === "success" && result.redirectUrl) {
      window.location.href = result.redirectUrl;
    }
    
    return result;
  }, initialState);

  // Freeプランのボタンクリック（ポータルに飛ぶ）
  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        safeError('Failed to create portal session');
      }
    } catch (error) {
      safeError('Error creating portal session', error);
    }
  };

  // ユーザーのプランに基づいてプランデータを取得し、翻訳を適用
  const planConfigs = getPlanConfigs(userPlan);
  const plans = planConfigs.map(plan => {
    const isYearly = billingCycle === 'yearly';
    const displayPrice = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
    const displayPriceLabel = isYearly && plan.yearlyPriceLabel ? plan.yearlyPriceLabel : plan.priceLabel;
    const displayPriceId = isYearly && plan.yearlyPriceId ? plan.yearlyPriceId : plan.priceId;
    const originalYearlyPrice = plan.id === 'standard' && isYearly ? '$119.88' : null;
    
    return {
      ...plan,
      name: t(plan.name as any),
      price: displayPrice,
      priceLabel: displayPriceLabel ? t(displayPriceLabel as any) : "",
      priceId: displayPriceId,
      originalYearlyPrice,
      showYearlySavings: plan.id === 'standard' && isYearly,
      features: plan.features.map(feature => t(feature as any)),
      buttonText: t(plan.buttonText as any),
    };
  });

  // 機能比較データも翻訳を適用
  const featureComparisonData = [
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
  ];
  
  const featureComparison = featureComparisonData.map(feature => ({
    label: t(feature.label as any),
    free: typeof feature.free === "boolean" ? feature.free : t(feature.free as any),
    standard: typeof feature.standard === "boolean" ? feature.standard : t(feature.standard as any),
    premium: typeof feature.premium === "boolean" ? feature.premium : t(feature.premium as any),
  }));

  return (
    <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
      <main className="container mx-auto px-4 py-4 lg:py-6">
        {/* Header Section */}
        <div className="py-6 lg:py-8 text-center lg:mb-12">
          <h1 className="text-2xl lg:text-3xl font-bold mb-3">
            {t("title")}
          </h1>
          <p className="text-sm lg:text-base text-gray-400">
            {t("description")}
          </p>

          {/* 月額/年額 トグルスイッチ */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
              {t("monthly")}
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2 focus:ring-offset-gray-950 ${
                billingCycle === 'yearly' ? 'bg-emerald-700' : 'bg-gray-600'
              }`}
              aria-label="Toggle billing cycle"
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
              {t("yearly")}
            </span>
          </div>
          
          {/* エラーメッセージ */}
          {state.status === "error" && state.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm">
              {state.error}
            </div>
          )}
        </div>

        {/* SP表示：カード型 */}
        <div className="md:hidden max-w-3xl mx-auto pb-12 px-6">
          <div className="flex flex-col gap-5 justify-center">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPending={isPending}
                formAction={formAction}
                onManageSubscription={handleManageSubscription}
                isMobile={true}
              />
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center space-y-1.5">
            <p className="text-xs text-gray-400">
              {t("premium_coming_soon")}
            </p>
          </div>
        </div>

        {/* PC表示：カード型 */}
        <div className="hidden md:block mx-auto pb-12 px-8">
          <div className="flex flex-row justify-center items-start space-x-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                featureComparison={featureComparison}
                isPending={isPending}
                formAction={formAction}
                onManageSubscription={handleManageSubscription}
                isMobile={false}
              />
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-10 text-center space-y-1.5">
            <p className="text-sm text-gray-400">
              {t("premium_coming_soon")}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
