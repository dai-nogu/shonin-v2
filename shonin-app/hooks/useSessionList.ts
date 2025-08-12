"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSessions } from "@/contexts/sessions-context"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

export function useSessionList() {
  const { user } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])

  // セッションコンテキストから状態を取得
  const {
    sessions,
    refetch
  } = useSessions()

  // 初期化処理
  useEffect(() => {
    if (!user) return

    const initializeApp = async () => {
      try {
        await refetch()
        setIsInitialized(true)
      } catch (error) {
        console.error('初期化エラー:', error)
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [user, refetch])

  // セッションデータが更新されたときに基本的な変換処理
  useEffect(() => {
    const updateCompletedSessions = () => {
      if (!sessions || sessions.length === 0) {
        setCompletedSessions([])
        return
      }

      const completedSessionsData = sessions.filter(session => session.end_time)
      
      if (completedSessionsData.length === 0) {
        setCompletedSessions([])
        return
      }

      // 基本的なCompletedSessionの型に変換（写真情報は含まない）
      const convertedSessions: CompletedSession[] = completedSessionsData.map(session => ({
        id: session.id,
        activityId: session.activity_id,
        activityName: session.activities?.name || '不明',
        startTime: new Date(session.start_time),
        endTime: new Date(session.end_time!),
        duration: session.duration,
        sessionDate: session.session_date || undefined,
        location: session.location || '',
        notes: session.notes || '',
        mood: session.mood || undefined,
        achievements: session.achievements || undefined,
        challenges: session.challenges || undefined,
        activityColor: session.activities?.color,
        activityIcon: session.activities?.icon || undefined,
        goalId: session.goal_id || undefined,
        hasPhotos: false // デフォルト値
      }))

      setCompletedSessions(convertedSessions)
    }

    updateCompletedSessions()
  }, [sessions])

  return {
    user,
    isInitialized,
    completedSessions,
    setCompletedSessions, // 写真フックで更新するために公開
    sessions
  }
} 