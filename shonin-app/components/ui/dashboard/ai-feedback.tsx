"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useState } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { useAIFeedback } from "@/hooks/use-ai-feedback"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { getPlanLimits } from "@/types/subscription"
import type { CompletedSession } from "./time-tracker"

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
      <Card className="bg-transparent border-white/10">
        <CardContent className="pt-6">
          <div className="text-center py-8 space-y-4">
            <div className="text-gray-400">
              <p className="mb-2">{t('plan.limit_modal.ai_feedback_line1')}</p>
              <p className="font-bold text-lg text-white">{t('plan.limit_modal.ai_feedback_line2')}</p>
            </div>
            <Button
              onClick={() => router.push('/plan')}
              className="bg-emerald-700 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('plan.limit_modal.view_plans')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
    setTimeout(() => {
      setCurrentIndex(newIndex)
      setIsTransitioning(false)
    }, 500) // フェードアウト時間短縮
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
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="px-0 pt-0 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center text-xl md:text-2xl font-bold tracking-tight">
              <span className="text-[#fffffC]">
                {currentFeedback.type}{t('ai_feedback.feedback')}
              </span>
            </CardTitle>
            
            {/* コントロール */}
            <div className="flex items-center space-x-2 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="text-gray-400 hover:text-white hover:bg-white/10 h-7 w-7 p-0 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex space-x-1.5 px-2">
                {feedbacks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleTransition(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex ? 'bg-blue-400 w-3' : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    aria-label={`${index === 0 ? '週次' : '月次'}フィードバックに切り替え`}
                  />
                ))}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                className="text-gray-400 hover:text-white hover:bg-white/10 h-7 w-7 p-0 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-0">
          <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            
            {/* フィードバック表示 */}
            <div className="rounded-xl border border-white/10 p-5">
              {error ? (
                <div className="text-red-400 flex items-center text-sm">
                  <span className="mr-2">⚠️</span>
                  {t('errors.generic')}: {error}
                </div>
              ) : (
                <p className="text-gray-300 leading-relaxed text-sm lg:text-base whitespace-pre-wrap">
                  {currentFeedback.message}
                </p>
              )}
            </div>

            {/* 次回フィードバック予告 */}
            <div className="mt-3 flex justify-end">
               <div className="inline-flex items-center px-3 py-1 text-[10px] lg:text-xs text-gray-500">
                {currentFeedback.type === t('ai_feedback.weekly') && (
                  <span>{t('ai_feedback.next_weekly_feedback')}: <span className="text-gray-400">{getNextWeekMonday()}</span> {t('ai_feedback.scheduled')}</span>
                )}
                {currentFeedback.type === t('ai_feedback.monthly') && (
                  <span>{t('ai_feedback.next_monthly_feedback')}: <span className="text-gray-400">{getNextMonthFirstDay()}</span> {t('ai_feedback.scheduled')}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}
