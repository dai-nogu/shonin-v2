"use client"

import { useEffect } from 'react'
import { AIFeedback } from "../ai-feedback"
import { useFeedback } from "@/contexts/feedback-context"
import { markAllFeedbacksAsRead } from "@/app/actions/feedback"
import type { CompletedSession } from "../time-tracker"

interface LetterSectionProps {
  completedSessions: CompletedSession[]
}

export function LetterSection({ completedSessions }: LetterSectionProps) {
  const { unreadCount, clearUnreadCount, refreshUnreadCount } = useFeedback()

  // セクションが表示されたらすべてのフィードバックを既読にする
  useEffect(() => {
    const markAsRead = async () => {
      if (unreadCount > 0) {
        const result = await markAllFeedbacksAsRead()
        if (result.success) {
          clearUnreadCount()
          setTimeout(() => {
            refreshUnreadCount()
          }, 500)
        }
      }
    }

    markAsRead()
  }, [])

  return (
    <AIFeedback completedSessions={completedSessions} />
  )
}
