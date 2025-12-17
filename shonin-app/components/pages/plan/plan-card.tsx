"use client"

import { memo } from "react"
import { Circle, Minus } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from "next-intl"

interface PlanCardProps {
  plan: {
    id: string
    name: string
    price: string
    priceLabel?: string
    originalYearlyPrice?: string | null
    showYearlySavings?: boolean
    features?: string[]
    buttonText: string
    isPopular?: boolean
    isCurrent?: boolean
    priceId?: string
  }
  featureComparison?: Array<{
    label: string
    starter: boolean | string
    standard: boolean | string
    premium: boolean | string
  }>
  isPending: boolean
  formAction: any
  onManageSubscription: () => void
  isMobile?: boolean
  isUserFree?: boolean  // Freeユーザーの場合はチェックアウトフローを使う
}

export const PlanCard = memo(function PlanCard({
  plan,
  featureComparison,
  isPending,
  formAction,
  onManageSubscription,
  isMobile = false,
  isUserFree = false
}: PlanCardProps) {
  const t = useTranslations("plan")

  const renderButton = () => {
    // 現在のプランの場合は無効化されたボタン
    if (plan.isCurrent) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <button
                  type="button"
                  disabled
                  className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto ${plan.isPopular ? 'bg-emerald-700' : 'bg-gray-600'} text-white cursor-not-allowed`}
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
      )
    }

    // Freeユーザーの場合はチェックアウトフロー（初回購入）
    if (isUserFree) {
      return (
        <form action={formAction}>
          <input type="hidden" name="priceId" value={plan.priceId} />
          <button
            type="submit"
            disabled={isPending}
            className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto ${plan.isPopular ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-gray-700 hover:bg-gray-600'} text-white active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isPending ? t("processing") : plan.buttonText}
          </button>
        </form>
      )
    }

    // 有料プランユーザーの場合はStripeビリングポータルに飛ばす
    return (
      <button
        type="button"
        onClick={onManageSubscription}
        disabled={isPending}
        className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto ${plan.isPopular ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-gray-700 hover:bg-gray-600'} text-white active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {isPending ? t("processing") : plan.buttonText}
      </button>
    )
  }

  return (
    <div
      className={`relative bg-gray-800 rounded-xl shadow-xl overflow-${isMobile ? 'hidden' : 'visible'} transition-all duration-300 hover:shadow-2xl flex flex-col ${
        isMobile ? 'ring-1' : 'border w-full max-w-sm'
      } ${
        plan.isPopular
          ? isMobile 
            ? "ring-2 ring-emerald-700 transform md:scale-105"
            : "border-emerald-700 transform scale-105"
          : isMobile 
            ? "ring-gray-700"
            : "border-white/30"
      }`}
    >
      <div className={`${isMobile ? 'p-5 lg:p-6' : 'p-6'} flex flex-col flex-1`}>
        {/* Plan Header */}
        <div className="text-center mb-5 lg:mb-6">
          <h2 className={`${isMobile ? 'text-lg lg:text-xl' : 'text-xl'} font-bold text-white mb-2 lg:mb-3`}>
            {plan.isCurrent ? t("current_plan") : plan.name}
          </h2>
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span className={`${isMobile ? 'text-3xl lg:text-4xl' : 'text-4xl'} font-extrabold ${plan.isPopular && !isMobile ? "text-emerald-400" : "text-white"}`}>
              {plan.price}
            </span>
            {plan.priceLabel && (
              <span className={`${isMobile ? 'text-sm lg:text-base' : 'text-base'} ${plan.isPopular && !isMobile ? "text-emerald-400/80" : "text-gray-400"}`}>
                {plan.priceLabel}
              </span>
            )}
            {plan.originalYearlyPrice && (
              <span className="text-sm text-gray-500 line-through">
                {plan.originalYearlyPrice}
              </span>
            )}
          </div>
          {plan.showYearlySavings && (
            <span className={`inline-block text-xs ${isMobile ? 'px-2 py-0.5' : 'px-2.5 py-1 mt-1'} rounded-full font-medium ${
              plan.id === 'premium' 
                ? 'bg-gray-700/50 text-white' 
                : 'bg-emerald-700/20 text-emerald-400'
            }`}>
              {t("yearly_savings")}
            </span>
          )}
        </div>

        {/* Features List - Mobile */}
        {isMobile && plan.features && (
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
        )}

        {/* Features List - Desktop (comparison) */}
        {!isMobile && featureComparison && (
          <div className="space-y-3 mb-6 flex-1">
            {featureComparison.map((feature, index) => {
              const featureValue = plan.id === "starter" ? feature.starter : plan.id === "standard" ? feature.standard : feature.premium;
              return (
                <div key={index} className="flex items-center justify-between py-2.5 border-b border-white/30">
                  <span className="text-sm text-white font-medium">
                    {feature.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {typeof featureValue === "boolean" ? (
                      featureValue ? (
                        <Circle className={`w-4 h-4 ${
                          plan.id === 'premium' 
                            ? "text-white" 
                            : plan.isPopular 
                              ? "text-emerald-400" 
                              : "text-emerald-500"
                        }`} />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-300" />
                      )
                    ) : (
                      <span className={`text-sm font-semibold ${
                        plan.id === 'premium' 
                          ? "text-white" 
                          : plan.isPopular 
                            ? "text-emerald-300" 
                            : "text-white"
                      }`}>
                        {featureValue}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Button */}
        {renderButton()}
      </div>
    </div>
  )
})

