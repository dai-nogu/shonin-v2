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

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

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
  
  // 開発用モックデータ（テスト結果から）
  const DEV_MOCK_DATA = {
    weekly: {
      overview: "13.6時間にわたって3つの大切な目標に着実に取り組まれた一週間でした。ジムでの新記録や英語での成長実感、LP制作の完了まで、それぞれの分野で具体的な進歩を重ねられました。",
      principle_application: "According to Confirmation Bias, あなたが「聞き取れる単語が増えてきた」「理解が深まってる実感」と感じられているのは、成長への意識が高まることで、以前なら見逃していた小さな進歩にも気づけるようになったからかもしれません。",
      insight: "月曜の朝のキツさを感じながらも「短時間でもやれた自分を褒めたい」と振り返られたその瞬間に、あなたの成長への真摯な姿勢が表れています。完璧でなくても続けることの価値を、あなた自身が一番よく理解されているのですね。",
      closing: "疲れや集中力の波を受け入れながらも、それでも歩み続けるあなたの姿勢が、確実に実を結んでいます。",
      principle_definition: "(人は自分の信念に合致する情報に注意を向け、矛盾する情報を無視する傾向)"
    },
    monthly: {
      overview: "This November, you dedicated nearly 52 hours across 46 sessions to building a stronger, more capable version of yourself. Your commitment showed up consistently in the gym, in your web development work, and in daily language learning moments.",
      principle_application: null,
      insight: "That moment when you successfully pressed 70kg for 8 reps speaks to something deeper than physical strength. You'd been building toward it session by session, and when the weight went up, it wasn't just your muscles that had grown stronger - it was your belief in what becomes possible through patient, persistent effort. The same quiet determination showed in your language learning, where you noticed more words becoming clear in podcasts during your commute, and in your web work, where you delivered projects that earned your clients' trust and brought repeat business.",
      closing: "As November closes with your body fat down 2% and your listening scores up 30 points, you're living proof that transformation happens not in dramatic leaps, but in showing up, even on those tired Monday mornings.",
      principle_definition: null
    }
  }

  // フィードバックを取得
  useEffect(() => {
    const loadFeedbacks = async () => {
      if (!planLimits.hasAIFeedback) return
      
      // 開発環境では自動的にdev-feedback.jsonを使用、本番では実際のAPIを使用
      const USE_DEV_FILE = process.env.NODE_ENV === 'development'
      
      if (USE_DEV_FILE) {
        try {
          // public/dev-feedback.jsonを読み込む
          const response = await fetch('/dev-feedback.json')
          if (response.ok) {
            const devData = await response.json()
            
            setFeedbacks([
              { 
                type: t('ai_feedback.weekly'), 
                date: devData.weekly_date || "2024-11-04", 
                message: devData.weekly || DEV_MOCK_DATA.weekly
              },
              { 
                type: t('ai_feedback.monthly'), 
                date: devData.monthly_date || "2024-11-01", 
                message: devData.monthly || DEV_MOCK_DATA.monthly
              }
            ])
            return
          }
        } catch (error) {
          console.warn('dev-feedback.jsonの読み込みに失敗、モックデータを使用します')
        }
        
        // ファイルが読み込めなかった場合はモックデータを使用
        setFeedbacks([
          { 
            type: t('ai_feedback.weekly'), 
            date: "2024-11-04", 
            message: DEV_MOCK_DATA.weekly
          },
          { 
            type: t('ai_feedback.monthly'), 
            date: "2024-11-01", 
            message: DEV_MOCK_DATA.monthly
          }
        ])
        return
      }
      
      // 実際のAPIからフィードバックを取得
      const [weeklyData, monthlyData] = await Promise.all([
        getWeeklyFeedback(),
        getMonthlyFeedback()
      ])
      
      setFeedbacks([
        { 
          type: t('ai_feedback.weekly'), 
          date: weeklyData?.period_start || "", 
          message: weeklyData?.feedback || t('ai_feedback.weekly_default_message')
        },
        { 
          type: t('ai_feedback.monthly'), 
          date: monthlyData?.period_start || "", 
          message: monthlyData?.feedback || t('ai_feedback.monthly_default_message')
        }
      ])
    }
    
    loadFeedbacks()
    
    // 開発環境でのみファイル変更を監視（5秒ごとにリロード）
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        loadFeedbacks()
      }, 5000) // 5秒ごとにリロード
      
      return () => clearInterval(interval)
    }
  }, [planLimits.hasAIFeedback, getWeeklyFeedback, getMonthlyFeedback, t])
  
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
            <>
              <p className="font-bold text-lg text-white">{t('plan.limit_modal.ai_feedback_line1')}</p>
            </>
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

  // フィードバック内容をフォーマットする関数
  const formatFeedbackMessage = (message: string | FeedbackContent): string => {
    // 文字列の場合はそのまま返す
    if (typeof message === 'string') {
      return message
    }

    // オブジェクトの場合は、構造化フィードバックとして整形
    const parts: string[] = []
    
    if (message.overview) {
      parts.push(message.overview)
    }
    
    if (message.principle_application) {
      parts.push(message.principle_application)
    }
    
    if (message.insight) {
      parts.push(message.insight)
    }
    
    if (message.closing) {
      parts.push(message.closing)
    }

    // 段落ごとに空行を入れて結合
    return parts.filter(Boolean).join('\n\n')
  }

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
                      index === currentIndex ? 'bg-emerald-500 w-3' : 'bg-gray-600 hover:bg-gray-500'
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
                  {formatFeedbackMessage(currentFeedback.message)}
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
