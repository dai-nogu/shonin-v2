"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { useAIFeedback } from "@/hooks/use-ai-feedback"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { getPlanLimits } from "@/types/subscription"
import { clientLogger } from "@/lib/client-logger"
import type { CompletedSession } from "./time-tracker"
import { AIFeedbackSkeleton } from "@/components/ui/feedback/ai-feedback-skeleton"
import { AIFeedbackUpgradePrompt } from "@/components/ui/feedback/ai-feedback-upgrade-prompt"
import { AIFeedbackCard } from "@/components/ui/feedback/ai-feedback-card"

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

// 開発用モックデータ
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

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  const t = useTranslations()
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

  // フィードバックを取得
  useEffect(() => {
    const loadFeedbacks = async () => {
      if (!planLimits.hasAIFeedback) return
      
      const USE_DEV_FILE = process.env.NODE_ENV === 'development'
      
      if (USE_DEV_FILE) {
        try {
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
          clientLogger.warn('dev-feedback.jsonの読み込みに失敗、モックデータを使用します')
        }
        
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
    
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        loadFeedbacks()
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [planLimits.hasAIFeedback, getWeeklyFeedback, getMonthlyFeedback, t])
  
  if (subscriptionLoading) {
    return <AIFeedbackSkeleton />
  }
  
  if (!planLimits.hasAIFeedback) {
    return <AIFeedbackUpgradePrompt />
  }

  const getNextWeekMonday = () => {
    const today = new Date()
    const thisWeekMonday = new Date(today)
    const daysSinceMonday = (today.getDay() + 6) % 7
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday)
    const nextWeekMonday = new Date(thisWeekMonday)
    nextWeekMonday.setDate(thisWeekMonday.getDate() + 7)
    return ` ${nextWeekMonday.getMonth() + 1}/${nextWeekMonday.getDate()} `
  }

  const getNextMonthFirstDay = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return ` ${nextMonth.getMonth() + 1}/${nextMonth.getDate()} `
  }

  const handleTransition = (newIndex: number) => {
    if (newIndex === currentIndex) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(newIndex)
      setIsTransitioning(false)
    }, 200)
  }

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + feedbacks.length) % feedbacks.length
    handleTransition(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % feedbacks.length
    handleTransition(newIndex)
  }

  return (
    <AIFeedbackCard
      currentFeedback={feedbacks[currentIndex]}
      currentIndex={currentIndex}
      totalCount={feedbacks.length}
      isTransitioning={isTransitioning}
      onPrevious={handlePrev}
      onNext={handleNext}
      getNextWeekMonday={getNextWeekMonday}
      getNextMonthFirstDay={getNextMonthFirstDay}
    />
  )
}
