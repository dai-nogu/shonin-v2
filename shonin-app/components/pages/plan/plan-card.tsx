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
    free: boolean | string
    standard: boolean | string
    premium: boolean | string
  }>
  isPending: boolean
  formAction: any
  onManageSubscription: () => void
  isMobile?: boolean
}

export const PlanCard = memo(function PlanCard({
  plan,
  featureComparison,
  isPending,
  formAction,
  onManageSubscription,
  isMobile = false
}: PlanCardProps) {
  const t = useTranslations("plan")

  const renderButton = () => {
    if (plan.id === "free") {
      if (plan.isCurrent) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled
                  className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500`}
                >
                  {plan.buttonText}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("current_plan_tooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
      return (
        <button
          type="button"
          onClick={onManageSubscription}
          className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600`}
        >
          {plan.buttonText}
        </button>
      )
    }

    if (plan.isCurrent) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <button
                  type="button"
                  disabled
                  className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto bg-emerald-700 text-white cursor-not-allowed`}
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

    return (
      <form action={formAction}>
        <input type="hidden" name="priceId" value={plan.priceId} />
        <button
          type="submit"
          disabled={isPending}
          className={`w-full ${isMobile ? 'py-2.5 lg:py-3 text-xs lg:text-sm' : 'py-3 text-base'} px-5 rounded-lg font-semibold transition-all duration-200 transform mt-auto bg-emerald-700 text-white active:scale-95 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none`}
        >
          {isPending ? t("processing") : plan.buttonText}
        </button>
      </form>
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
      {plan.isPopular && (
        <div className={`absolute ${
          isMobile 
            ? "top-0 right-0 bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold rounded-bl-lg shadow-lg"
            : "-top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white px-5 py-1.5 text-sm font-bold rounded-full shadow-lg z-10"
        }`}>
          {t("popular")}
        </div>
      )}

      <div className={`${isMobile ? 'p-5 lg:p-6' : 'p-6'} flex flex-col flex-1`}>
        {/* Plan Header */}
        <div className="text-center mb-5 lg:mb-6">
          <h2 className={`${isMobile ? 'text-lg lg:text-xl' : 'text-xl'} font-bold text-white mb-2 lg:mb-3 ${plan.isPopular && !isMobile ? "mt-1" : ""}`}>
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
            <span className={`inline-block text-xs bg-emerald-700/20 text-emerald-400 ${isMobile ? 'px-2 py-0.5' : 'px-2.5 py-1 mt-1'} rounded-full font-medium`}>
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
        )}

        {/* CTA Button */}
        {renderButton()}
      </div>
    </div>
  )
})

