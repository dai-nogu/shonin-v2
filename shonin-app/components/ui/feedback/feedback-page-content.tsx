"use client"

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { AIFeedback } from "@/components/ui/dashboard/ai-feedback"
import { useSessionList } from "@/hooks/useSessionList"
import { useFeedback } from "@/contexts/feedback-context"
import { markAllFeedbacksAsRead } from "@/app/actions/feedback"

export function FeedbackPageContent() {
  const t = useTranslations()
  const { completedSessions } = useSessionList()
  const { unreadCount, clearUnreadCount, refreshUnreadCount } = useFeedback()

  // フィードバックページを開いたら、すべてのフィードバックを既読にする
  useEffect(() => {
    const markAsRead = async () => {
      // 未読がある場合のみ実行
      if (unreadCount > 0) {
        const result = await markAllFeedbacksAsRead()
        if (result.success) {
          // 楽観的UI更新
          clearUnreadCount()
          // 念のため再取得
          setTimeout(() => {
            refreshUnreadCount()
          }, 500)
        }
      }
    }

    markAsRead()
  }, []) // ページマウント時に1回だけ実行

  return (
    <div className="max-w-4xl mx-auto">
      <AIFeedback completedSessions={completedSessions} />
    </div>
  )
}

