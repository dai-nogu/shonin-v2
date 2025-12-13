"use client"

import { memo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'

interface FeedbackContent {
  overview: string;
  principle_application?: string | null;
  insight?: string;
  closing?: string;
  principle_definition?: string | null;
}

interface FeedbackData {
  type: string
  date: string
  message: string | FeedbackContent
}

interface AIFeedbackCardProps {
  currentFeedback: FeedbackData
  currentIndex: number
  totalCount: number
  isTransitioning: boolean
  onPrevious: () => void
  onNext: () => void
  getNextWeekMonday: () => string
}

export const AIFeedbackCard = memo(function AIFeedbackCard({
  currentFeedback,
  currentIndex,
  totalCount,
  isTransitioning,
  onPrevious,
  onNext,
  getNextWeekMonday
}: AIFeedbackCardProps) {
  const t = useTranslations()

  const renderFeedbackContent = () => {
    const message = currentFeedback.message

    if (typeof message === 'string') {
      return (
        <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 mb-3 whitespace-pre-wrap leading-relaxed text-gray-100 text-sm md:text-base">
          {message}
        </div>
      )
    }

    return (
      <div className="space-y-4 text-gray-100">
        {/* Overview Section */}
        <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
          <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {message.overview}
          </p>
        </div>

        {/* Principle Application (if present) */}
        {message.principle_application && (
          <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-lg p-3 md:p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-emerald-400 font-semibold text-xs md:text-sm flex-shrink-0">
                📚 {t('ai_feedback.principle_application')}
              </span>
            </div>
            <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.principle_application}
            </p>
            {message.principle_definition && (
              <p className="text-gray-400 text-xs md:text-sm mt-2 italic">
                {message.principle_definition}
              </p>
            )}
          </div>
        )}

        {/* Insight Section */}
        {message.insight && (
          <div className="bg-gray-800/50 rounded-lg p-3 md:p-4">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-blue-400 font-semibold text-xs md:text-sm flex-shrink-0">
                💡 {t('ai_feedback.insight')}
              </span>
            </div>
            <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {message.insight}
            </p>
          </div>
        )}

        {/* Closing Message */}
        {message.closing && (
          <div className="bg-gradient-to-r from-emerald-700/10 to-blue-700/10 rounded-lg p-3 md:p-4 border-l-4 border-emerald-500">
            <p className="text-gray-100 text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">
              {message.closing}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-[1.25rem] md:text-2xl">
            {currentFeedback.type}
            {currentFeedback.date && (
              <span className="text-gray-400 text-sm md:text-base font-normal ml-2 md:ml-3">
                ({currentFeedback.date})
              </span>
            )}
          </CardTitle>
          {totalCount > 1 && (
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <span className="text-gray-400 text-xs md:text-sm min-w-[3rem] text-center">
                {currentIndex + 1} / {totalCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNext}
                disabled={currentIndex === totalCount - 1}
                className="text-gray-400 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {renderFeedbackContent()}
          
          {/* 次回のフィードバック予定 */}
          {currentIndex === 0 && (
            <div className="mt-4 text-xs md:text-sm text-gray-400 text-center">
              {t('ai_feedback.next_feedback', { date: getNextWeekMonday() })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

