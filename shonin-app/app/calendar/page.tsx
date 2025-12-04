"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { CalendarView } from "@/components/calendar-view"
import { useSessions } from "@/contexts/sessions-context"
import { hasSessionPhotosMultiple } from "@/lib/upload-photo"
import type { CompletedSession } from "@/components/time-tracker"

export default function Calendar() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  const [isInitialized, setIsInitialized] = useState(false)

  // セッションコンテキストから状態を取得
  const { sessions, refetch } = useSessions()

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // URLパラメータからビューモードを設定
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'week' || view === 'month') {
      setCalendarViewMode(view)
    }
  }, [searchParams])

  // 初期化処理
  useEffect(() => {
    if (!user) return

    const initializeApp = async () => {
      try {
        // ローカルストレージから設定を復元
        const savedViewMode = localStorage.getItem('app-calendar-view-mode')
        if (savedViewMode === 'month' || savedViewMode === 'week') {
          setCalendarViewMode(savedViewMode)
        }

        await refetch()
        setIsInitialized(true)
      } catch (error) {
        console.error('初期化エラー:', error)
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [user, refetch])

  // セッションデータが更新されたときに写真の有無を確認
  useEffect(() => {
    const updateSessionsWithPhotos = async () => {
      if (!sessions || sessions.length === 0) {
        setCompletedSessions([])
        return
      }

      const completedSessionsData = sessions.filter(session => session.end_time)
      
      if (completedSessionsData.length === 0) {
        setCompletedSessions([])
        return
      }

      const sessionIds = completedSessionsData.map(session => session.id)
      const photoStatusMap = await hasSessionPhotosMultiple(sessionIds)

      const sessionsWithPhotos: CompletedSession[] = completedSessionsData.map(session => ({
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
        hasPhotos: photoStatusMap[session.id] || false
      }))

      setCompletedSessions(sessionsWithPhotos)
    }

    updateSessionsWithPhotos()
  }, [sessions])

  // カレンダー表示モードの保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('app-calendar-view-mode', calendarViewMode)
    }
  }, [calendarViewMode, isInitialized])

  // 認証状態をチェック中の場合はローディング表示
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">認証確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない
  if (!user) {
    return null
  }

  // 初期化が完了するまでローディング表示
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <CalendarView 
        viewMode={calendarViewMode} 
        onViewModeChange={setCalendarViewMode} 
        completedSessions={completedSessions}
      />
    </main>
  )
} 