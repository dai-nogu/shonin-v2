"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Minus, Circle } from "lucide-react";

export default function PlanPageClient() {
  const t = useTranslations("plan");

  const plans = [
    {
      id: "free",
      name: t("free"),
      price: "$0",
      priceLabel: "",
      features: [
        t("features.activity_limit"),
        t("features.goal_limit"),
        t("features.no_past_calendar"),
        t("features.no_ai"),
      ],
      isCurrent: true,
      buttonText: t("current_plan"),
      buttonVariant: "outline" as const,
    },
    {
      id: "standard",
      name: t("standard"),
      price: "$9.99",
      priceLabel: t("per_month"),
      features: [
        t("features.unlimited_activities"),
        t("features.unlimited_goals"),
        t("features.full_calendar"),
        t("features.ai_feedback"),
      ],
      isCurrent: false,
      buttonText: t("upgrade"),
      buttonVariant: "default" as const,
      isPopular: true,
    },
  ];

  // 表形式用の機能リスト
  const featureComparison = [
    {
      label: t("features.activity_label"),
      free: t("features.up_to_3"),
      standard: t("features.unlimited"),
    },
    {
      label: t("features.goal_label"),
      free: t("features.up_to_3_goals"),
      standard: t("features.unlimited"),
    },
    {
      label: t("features.calendar_label"),
      free: t("features.current_month_only"),
      standard: t("features.all_days"),
    },
    {
      label: t("features.ai_label"),
      free: false,
      standard: true,
    },
  ];

  return (
    <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
      <main className="container mx-auto px-4 py-4 lg:py-6">
        {/* Header Section */}
        <div className="py-6 lg:py-8 text-center">
          <h1 className="text-2xl lg:text-3xl font-bold mb-3">
            {t("title")}
          </h1>
          <p className="text-sm lg:text-base text-gray-400">
            {t("description")}
          </p>
        </div>

        {/* SP表示：カード型 */}
        <div className="md:hidden max-w-3xl mx-auto pb-12">
          <div className="flex flex-col gap-5 justify-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl md:flex-1 flex flex-col ${
                  plan.isPopular
                    ? "ring-2 ring-green-500 transform md:scale-105"
                    : "ring-1 ring-gray-700"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-600 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg">
                    {t("popular")}
                  </div>
                )}

                <div className="p-5 lg:p-6 flex flex-col flex-1">
                  {/* Plan Header */}
                  <div className="text-center mb-5 lg:mb-6">
                    <h2 className="text-lg lg:text-xl font-bold text-white mb-2 lg:mb-3">
                      {plan.name}
                    </h2>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-3xl lg:text-4xl font-extrabold text-white">
                        {plan.price}
                      </span>
                      {plan.priceLabel && (
                        <span className="text-sm lg:text-base text-gray-400 ml-1">
                          {plan.priceLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6 lg:mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        <Circle className="w-4 h-4 lg:w-5 lg:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs lg:text-sm text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    disabled={plan.isCurrent}
                    className={`w-full py-2.5 lg:py-3 px-5 rounded-lg font-semibold text-xs lg:text-sm transition-all duration-200 transform mt-auto ${
                      plan.buttonVariant === "default"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:transform-none"
                        : "bg-gray-700 text-gray-300 cursor-default border border-gray-600"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center space-y-1.5">
            <p className="text-xs text-gray-400">
              ※ プレミアムプランは近日公開予定です。
            </p>
          </div>
        </div>

        {/* PC表示：カード型 */}
        <div className="hidden md:block max-w-4xl mx-auto pb-12">
          <div className="grid grid-cols-2 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-xl shadow-xl overflow-visible transition-all duration-300 hover:shadow-2xl flex flex-col border ${
                  plan.isPopular
                    ? "border-green-500 transform scale-105"
                    : "border-white/30"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-1.5 text-xs font-bold rounded-full shadow-lg z-10">
                    {t("popular")}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h2 className={`text-xl font-bold text-white mb-3 ${plan.isPopular ? "mt-1" : ""}`}>
                      {plan.name}
                    </h2>
                    <div className="flex items-baseline justify-center gap-1 mb-4">
                      <span className={`text-4xl font-extrabold ${plan.isPopular ? "text-green-400" : "text-white"}`}>
                        {plan.price}
                      </span>
                      {plan.priceLabel && (
                        <span className={`text-base ${plan.isPopular ? "text-green-400/80" : "text-gray-400"}`}>
                          {plan.priceLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-1">
                    {featureComparison.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between py-2.5 border-b border-white/30">
                        <span className="text-xs text-gray-300 font-medium">
                          {feature.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {typeof (plan.id === "free" ? feature.free : feature.standard) === "boolean" ? (
                            (plan.id === "free" ? feature.free : feature.standard) ? (
                              <Circle className={`${index === 3 ? "w-5 h-5" : "w-4 h-4"} ${plan.isPopular ? "text-green-400" : "text-green-500"}`} />
                            ) : (
                              <Minus className={`${index === 3 ? "w-5 h-5" : "w-4 h-4"} text-gray-300`} />
                            )
                          ) : (
                            <span className={`text-xs font-semibold ${plan.isPopular ? "text-green-300" : "text-gray-300"}`}>
                              {plan.id === "free" ? feature.free : feature.standard}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    disabled={plan.isCurrent}
                    className={`w-full py-3 px-5 rounded-lg font-semibold text-sm transition-all duration-200 transform mt-auto ${
                      plan.buttonVariant === "default"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg active:scale-95 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed disabled:transform-none"
                        : "bg-gray-700 text-gray-300 cursor-default border border-gray-600"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-10 text-center space-y-1.5">
            <p className="text-sm text-gray-400">
              ※ プレミアムプランは近日公開予定です。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

