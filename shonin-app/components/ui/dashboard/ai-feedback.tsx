"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { useAIFeedback } from "@/hooks/use-ai-feedback"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { getPlanLimits } from "@/types/subscription"
import type { CompletedSession } from "./time-tracker"
import { safeError } from "@/lib/safe-logger"

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

interface FeedbackData {
  type: string
  date: string
  message: string
}

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  const t = useTranslations()
  const router = useRouter()
  const { userPlan, loading: subscriptionLoading } = useSubscriptionContext()
  const planLimits = getPlanLimits(userPlan)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([
    { type: t('ai_feedback.weekly'), date: "", message: t('ai_feedback.weekly_default_message') },
    { type: t('ai_feedback.monthly'), date: "", message: t('ai_feedback.monthly_default_message') }
  ])
  
  const { 
    error, 
    getWeeklyFeedback, 
    getMonthlyFeedback
  } = useAIFeedback()
  
  // サブスクリプション情報のローディング中はスケルトンを表示
  if (subscriptionLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-3 lg:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-[1.25rem] md:text-2xl">
              <div className="h-7 w-48 bg-gray-800 animate-pulse rounded"></div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 animate-pulse rounded w-full"></div>
              <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6"></div>
              <div className="h-4 bg-gray-700 animate-pulse rounded w-4/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Freeプランの場合はアップグレードプロンプトを表示
  if (!planLimits.hasAIFeedback) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="text-gray-400">
              <p className="mb-2">{t('plan.limit_modal.ai_feedback_line1')}</p>
              <p className="font-bold text-lg text-white">{t('plan.limit_modal.ai_feedback_line2')}</p>
            </div>
            <Button
              onClick={() => router.push('/plan')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              {t('plan.limit_modal.view_plans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 日付をフォーマット（月/日形式）
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 日付範囲を文字列に変換
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${formatDate(startDate)} 〜 ${formatDate(endDate)}`
  }

  // 来週月曜日の日付を計算
  const getNextWeekMonday = () => {
    const today = new Date()
    const thisWeekMonday = new Date(today)
    const daysSinceMonday = (today.getDay() + 6) % 7
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday)
    const nextWeekMonday = new Date(thisWeekMonday)
    nextWeekMonday.setDate(thisWeekMonday.getDate() + 7)
    return `${nextWeekMonday.getMonth() + 1}/${nextWeekMonday.getDate()}`
  }

  // 来月1日の日付を計算
  const getNextMonthFirstDay = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return `${nextMonth.getMonth() + 1}/${nextMonth.getDate()}`
  }

  const handleTransition = (newIndex: number) => {
    if (newIndex === currentIndex) return
    
    setIsTransitioning(true)
    setIsExpanded(false) // 切り替え時は折りたたみ状態にリセット
    setTimeout(() => {
      setCurrentIndex(newIndex)
      setIsTransitioning(false)
    }, 1000) // フェードアウト時間
  }

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + feedbacks.length) % feedbacks.length
    handleTransition(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % feedbacks.length
    handleTransition(newIndex)
  }

  const currentFeedback = feedbacks[currentIndex]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-[1.25rem] md:text-2xl">
            {currentFeedback.type}{t('ai_feedback.feedback')}
          </CardTitle>
          
          {/* コントロール */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* インジケーター */}
            <div className="flex space-x-1">
              {feedbacks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTransition(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${index === 0 ? '週次' : '月次'}フィードバックに切り替え`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {/* 日付表示 */}
          {currentFeedback.date && (
            <div className="flex justify-end mb-2 lg:mb-3">
              <span className="text-xs text-gray-400">{currentFeedback.date}</span>
            </div>
          )}

          {/* フィードバックメッセージ */}
          <div className="bg-gray-800 rounded-lg p-3 mb-3 relative">
            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                !currentFeedback.date || isExpanded ? 'max-h-[500px]' : 'max-h-[1.5em]'
              }`}
            >
              <p className="text-gray-300 text-sm leading-relaxed pr-8">
                {error ? (
                  <span className="text-red-400">{t('errors.generic')}: {error}</span>
                ) : (
                  currentFeedback.message
                )}
              </p>
            </div>
            {/* 開閉ボタン（実際のFBがある時のみ表示） */}
            {currentFeedback.date && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute right-2 bottom-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                aria-label={isExpanded ? '折りたたむ' : '展開する'}
              >
                <div className="relative w-3 h-3">
                  {/* 横棒（常に表示） */}
                  <span className="absolute top-1/2 left-0 w-full h-0.5 bg-current -translate-y-1/2 rounded-full" />
                  {/* 縦棒（回転してマイナスになる） */}
                  <span 
                    className={`absolute top-0 left-1/2 w-0.5 h-full bg-current -translate-x-1/2 rounded-full transition-transform duration-300 ease-in-out origin-center ${
                      isExpanded ? 'rotate-90' : 'rotate-0'
                    }`}
                  />
                </div>
              </button>
            )}
          </div>

                      {/* 次回フィードバック予告 */}
            <div className="text-xs text-gray-500">
              {currentFeedback.type === t('ai_feedback.weekly') && (
                <div>{t('ai_feedback.next_weekly_feedback')}: {getNextWeekMonday()} {t('ai_feedback.scheduled')}</div>
              )}
              {currentFeedback.type === t('ai_feedback.monthly') && (
                <div>{t('ai_feedback.next_monthly_feedback')}: {getNextMonthFirstDay()} {t('ai_feedback.scheduled')}</div>
              )}
            </div>
        </div>
      </CardContent>
    </Card>
  )
} 