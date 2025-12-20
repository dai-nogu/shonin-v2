"use client"

import { memo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
  getNextMonthFirstDay: () => string
}

export const AIFeedbackCard = memo(function AIFeedbackCard({
  currentFeedback,
  currentIndex,
  totalCount,
  isTransitioning,
  onPrevious,
  onNext,
  getNextWeekMonday,
  getNextMonthFirstDay
}: AIFeedbackCardProps) {
  const t = useTranslations()

  const renderFeedbackContent = () => {
    const message = currentFeedback.message

    if (typeof message === 'string') {
      return (
        <p className="whitespace-pre-wrap leading-[2.0] text-gray-100 text-base md:text-lg tracking-wide">
          {message}
        </p>
      )
    }

    // 全てのテキストを一つの文章として結合
    const fullText = [
      message.overview,
      message.principle_application,
      // message.principle_definition, // UIには表示しない
      message.insight,
      message.closing
    ]
      .filter(Boolean) // null/undefinedを除外
      .join('\n') // 段落間の空行をなくす

    return (
      <p className="whitespace-pre-wrap leading-[2] text-gray-100 text-base md:text-lg tracking-wide">
        {fullText}
      </p>
    )
  }

  return (
    <div className="relative flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
        <h1 className="text-xl md:text-2xl font-bold text-white">
          {currentFeedback.type}
        </h1>
        
        {/* ナビゲーション */}
        {totalCount > 1 && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="text-gray-400 hover:text-white hover:bg-transparent disabled:opacity-30 h-8 w-8 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            {/* ドットインジケーター */}
            <div className="flex gap-2 items-center">
              {Array.from({ length: totalCount }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={currentIndex === totalCount - 1}
              className="text-gray-400 hover:text-white hover:bg-transparent disabled:opacity-30 h-8 w-8 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* メインコンテンツカード */}
      <div className="border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 shadow-lg backdrop-blur-sm group/card transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden">
        {/* グローエフェクト用のオーバーレイ */}
        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
        </div>

        <div 
          className={`transition-opacity duration-300 relative z-10 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        >
          {renderFeedbackContent()}
        </div>
      </div>

      {/* 次回のフィードバック予定 - カードの外に配置 */}
      <div className="mt-3 text-xs text-gray-500 text-right font-medium">
        {currentFeedback.type.includes(t('ai_feedback.weekly')) ? (
          <>
            {t('ai_feedback.next_weekly_feedback')}{getNextWeekMonday()}{t('ai_feedback.scheduled')}
          </>
        ) : (
          <>
            {t('ai_feedback.next_monthly_feedback')}{getNextMonthFirstDay()}{t('ai_feedback.scheduled')}
          </>
        )}
      </div>
    </div>
  )
})

