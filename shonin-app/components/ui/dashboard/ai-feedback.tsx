"use client"

import { ChevronLeft, ChevronRight, RefreshCw, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useRouter } from "next/navigation"
import { useAIFeedback } from "@/hooks/use-ai-feedback"
import { useSubscription } from "@/hooks/use-subscription"
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
  const { userPlan, loading: subscriptionLoading } = useSubscription()
  const planLimits = getPlanLimits(userPlan)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([
    { type: t('ai_feedback.weekly'), date: "", message: t('ai_feedback.weekly_default_message') },
    { type: t('ai_feedback.monthly'), date: "", message: t('ai_feedback.monthly_default_message') }
  ])
  
  const { 
    isLoading, 
    error, 
    getWeeklyFeedback, 
    getMonthlyFeedback,
    getExistingFeedback,
    getLastWeekRange,
    getLastMonthRange
  } = useAIFeedback()
  
  // Freeプランの場合はアップグレードプロンプトを表示
  if (!subscriptionLoading && !planLimits.hasAIFeedback) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {t('ai_feedback.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="text-gray-400">
              <p className="mb-2">AIによる週次・月次フィードバック機能は</p>
              <p className="font-bold text-lg text-white">Standardプラン以上</p>
              <p className="mt-2">でご利用いただけます</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg space-y-2 text-sm text-gray-300">
              <p>✨ あなたの努力を振り返り</p>
              <p>✨ 成長のパターンを発見</p>
              <p>✨ 励ましと具体的なアドバイス</p>
            </div>
            <Button
              onClick={() => router.push('/plan')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              プランを見る
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

  // フィードバックを読み込む
  const loadFeedbacks = async () => {
    try {
      const weekRange = getLastWeekRange()
      const monthRange = getLastMonthRange()

      const [weeklyResult, monthlyResult] = await Promise.all([
        getWeeklyFeedback(),
        getMonthlyFeedback()
      ])

      const newFeedbacks = []

      // 週次フィードバック
      if (weeklyResult?.feedback) {
        newFeedbacks.push({
          type: t('ai_feedback.weekly'),
          date: formatDateRange(weeklyResult.period_start, weeklyResult.period_end),
          message: weeklyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: t('ai_feedback.weekly'), 
          date: "", 
          message: t('ai_feedback.weekly_no_data_message')
        })
      }

      // 月次フィードバック
      if (monthlyResult?.feedback) {
        newFeedbacks.push({
          type: t('ai_feedback.monthly'),
          date: formatDateRange(monthlyResult.period_start, monthlyResult.period_end),
          message: monthlyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: t('ai_feedback.monthly'), 
          date: "", 
          message: t('ai_feedback.monthly_no_data_message')
        })
      }

      setFeedbacks(newFeedbacks)
    } catch (err) {
      console.error('フィードバック読み込みエラー:', err)
      setFeedbacks([
        { type: t('ai_feedback.weekly'), date: "", message: t('ai_feedback.weekly_no_data_message') },
        { type: t('ai_feedback.monthly'), date: "", message: t('ai_feedback.monthly_no_data_message') }
      ])
    }
  }

  // 初期状態ではAPIアクセスしない（フィードバック生成ボタン押下時のみ）
  // useEffect(() => {
  //   loadFeedbacks()
  // }, [])

  // 自動ループ機能は無効化（手動操作のみ）
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setIsTransitioning(true)
  //     setTimeout(() => {
  //       setCurrentIndex((prev) => (prev + 1) % feedbacks.length)
  //       setIsTransitioning(false)
  //     }, 1000) // フェードアウト時間
  //   }, 20000) // 20秒ごとに切り替え

  //   return () => clearInterval(interval)
  // }, [feedbacks.length])

  const handleTransition = (newIndex: number) => {
    if (newIndex === currentIndex) return
    
    setIsTransitioning(true)
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

  const handleRefresh = async () => {
    try {
      const weekRange = getLastWeekRange()
      const monthRange = getLastMonthRange()

      // 既存のフィードバックのみを取得（新規生成はしない）
      const [weeklyResult, monthlyResult] = await Promise.all([
        getExistingFeedback('weekly', weekRange.start, weekRange.end),
        getExistingFeedback('monthly', monthRange.start, monthRange.end)
      ])

      const newFeedbacks = []

      // 週次フィードバック
      if (weeklyResult?.feedback) {
        newFeedbacks.push({
          type: t('ai_feedback.weekly'),
          date: formatDateRange(weeklyResult.period_start, weeklyResult.period_end),
          message: weeklyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: t('ai_feedback.weekly'), 
          date: "", 
          message: t('ai_feedback.weekly_no_data_message')
        })
      }

      // 月次フィードバック
      if (monthlyResult?.feedback) {
        newFeedbacks.push({
          type: t('ai_feedback.monthly'),
          date: formatDateRange(monthlyResult.period_start, monthlyResult.period_end),
          message: monthlyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: t('ai_feedback.monthly'), 
          date: "", 
          message: t('ai_feedback.monthly_no_data_message')
        })
      }

      setFeedbacks(newFeedbacks)
    } catch (err) {
      console.error('フィードバック再読み込みエラー:', err)
      setFeedbacks([
        { type: t('ai_feedback.weekly'), date: "", message: t('ai_feedback.weekly_no_data_message') },
        { type: t('ai_feedback.monthly'), date: "", message: t('ai_feedback.monthly_no_data_message') }
      ])
    }
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
            {/* 更新ボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
              title="既存フィードバックを再読み込み"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
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
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <p className="text-gray-300 text-sm leading-relaxed">
              {isLoading ? (
                <span className="flex items-center">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  {t('ai_feedback.generating')}
                </span>
              ) : error ? (
                <span className="text-red-400">{t('errors.generic')}: {error}</span>
              ) : (
                currentFeedback.message
              )}
            </p>
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