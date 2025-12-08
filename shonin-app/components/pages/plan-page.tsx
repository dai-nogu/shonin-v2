"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Minus, Circle } from "lucide-react";
import { getPlanConfigs } from "@/lib/plan-config";
import { useActionState, useState } from "react";
import { createStripeSession } from "@/app/actions/stripe";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { PlanType, BillingCycle } from "@/types/subscription";
import { safeError } from "@/lib/safe-logger";

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
    // 年額の場合は価格とpriceIdを切り替え
    const isYearly = billingCycle === 'yearly';
    const displayPrice = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price;
    const displayPriceLabel = isYearly && plan.yearlyPriceLabel ? plan.yearlyPriceLabel : plan.priceLabel;
    const displayPriceId = isYearly && plan.yearlyPriceId ? plan.yearlyPriceId : plan.priceId;
    // 通常の年額（月額×12）- Standardプランのみ
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
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex-1 flex flex-col ${
                  plan.isPopular
                    ? "ring-2 ring-emerald-700 transform md:scale-105"
                    : "ring-1 ring-gray-700"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg">
                    {t("popular")}
                  </div>
                )}

                <div className="p-5 lg:p-6 flex flex-col flex-1">
                  {/* Plan Header */}
                  <div className="text-center mb-5 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-bold text-white mb-2 lg:mb-3">
                      {plan.isCurrent ? t("current_plan") : plan.name}
                    </h2>
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className="text-3xl lg:text-4xl font-extrabold text-white">
                        {plan.price}
                      </span>
                      {plan.priceLabel && (
                        <span className="text-sm lg:text-base text-gray-400">
                          {plan.priceLabel}
                        </span>
                      )}
                      {/* 通常年額（取り消し線） */}
                      {plan.originalYearlyPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {plan.originalYearlyPrice}
                        </span>
                      )}
                    </div>
                    {/* 2ヶ月分お得バッジ */}
                    {plan.showYearlySavings && (
                      <span className="inline-block text-xs bg-emerald-700/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                        {t("yearly_savings")}
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6 lg:mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Circle className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs lg:text-sm text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  {plan.id === "free" ? (
                    plan.isCurrent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled
                              className="w-full py-2.5 lg:py-3 px-5 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 transform mt-auto bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500"
                            >
                              {plan.buttonText}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("current_plan_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <button
                        type="button"
                        onClick={handleManageSubscription}
                        className="w-full py-2.5 lg:py-3 px-5 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 transform mt-auto bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                      >
                        {plan.buttonText}
                      </button>
                    )
                  ) : (
                    plan.isCurrent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <button
                                type="button"
                                disabled
                                className="w-full py-2.5 lg:py-3 px-5 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 transform mt-auto bg-emerald-700 text-white cursor-not-allowed"
                              >
                                {plan.buttonText}
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("current_plan_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <form action={formAction}>
                        <input type="hidden" name="priceId" value={plan.priceId} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full py-2.5 lg:py-3 px-5 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 transform mt-auto bg-emerald-700 text-white active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isPending ? t("processing") : plan.buttonText}
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>
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
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-xl shadow-xl overflow-visible transition-all duration-300 hover:shadow-2xl flex flex-col border w-full max-w-sm ${
                  plan.isPopular
                    ? "border-emerald-700 transform scale-105"
                    : "border-white/30"
                }`}
              >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-5 py-1.5 text-sm font-bold rounded-full shadow-lg z-10">
                      {t("popular")}
                    </div>
                  )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h2 className={`text-xl font-bold text-white mb-3 ${plan.isPopular ? "mt-1" : ""}`}>
                      {plan.isCurrent ? t("current_plan") : plan.name}
                    </h2>
                    <div className="flex items-baseline justify-center gap-2 mb-1">
                      <span className={`text-4xl font-extrabold ${plan.isPopular ? "text-emerald-400" : "text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.priceLabel && (
                        <span className={`text-base ${plan.isPopular ? "text-emerald-400/80" : "text-gray-400"}`}>
                          {plan.priceLabel}
                        </span>
                      )}
                      {/* 通常年額（取り消し線） */}
                      {plan.originalYearlyPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {plan.originalYearlyPrice}
                        </span>
                      )}
                    </div>
                    {/* 2ヶ月分お得バッジ */}
                    {plan.showYearlySavings && (
                      <span className="inline-block text-xs bg-emerald-700/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium mt-1">
                        {t("yearly_savings")}
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-1">
                    {featureComparison.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between py-2.5 border-b border-white/30">
                        <span className="text-sm text-white font-medium">
                          {feature.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {typeof (plan.id === "free" ? feature.free : feature.standard) === "boolean" ? (
                            (plan.id === "free" ? feature.free : feature.standard) ? (
                              <Circle className={`${index === 3 ? "w-5 h-5" : "w-4 h-4"} ${plan.isPopular ? "text-emerald-400" : "text-emerald-500"}`} />
                            ) : (
                              <Minus className={`${index === 3 ? "w-5 h-5" : "w-4 h-4"} text-gray-300`} />
                            )
                          ) : (
                            <span className={`text-sm font-semibold ${plan.isPopular ? "text-emerald-300" : "text-white"}`}>
                              {plan.id === "free" ? feature.free : feature.standard}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  {plan.id === "free" ? (
                    plan.isCurrent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 px-5 rounded-lg font-semibold text-base transition-all duration-200 transform mt-auto bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500"
                            >
                              {plan.buttonText}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("current_plan_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <button
                        type="button"
                        onClick={handleManageSubscription}
                        className="w-full py-3 px-5 rounded-lg font-semibold text-base transition-all duration-200 transform mt-auto bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                      >
                        {plan.buttonText}
                      </button>
                    )
                  ) : (
                    plan.isCurrent ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <button
                                type="button"
                                disabled
                                className="w-full py-3 px-5 rounded-lg font-semibold text-base transition-all duration-200 transform mt-auto bg-emerald-700 text-white cursor-not-allowed"
                              >
                                {plan.buttonText}
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("current_plan_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <form action={formAction}>
                        <input type="hidden" name="priceId" value={plan.priceId} />
                        <button
                          type="submit"
                          disabled={isPending}
                          className="w-full py-3 px-5 rounded-lg font-semibold text-base transition-all duration-200 transform mt-auto bg-emerald-700 text-white active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {isPending ? t("processing") : plan.buttonText}
                        </button>
                      </form>
                    )
                  )}
                </div>
              </div>
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
