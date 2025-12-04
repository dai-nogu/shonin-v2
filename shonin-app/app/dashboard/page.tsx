"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SidebarInset } from "@/components/ui/sidebar"
import { TimeTracker } from "@/components/time-tracker"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { Header } from "@/components/header"
import { useSessions } from "@/contexts/sessions-context"
import { hasSessionPhotosMultiple, preloadImages, getSessionPhotos } from "@/lib/upload-photo"
import type { SessionData, CompletedSession } from "@/components/time-tracker"

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // セッションコンテキストから状態を取得
  const {
    sessions,
    loading,
    error,
    currentSession,
    isSessionActive,
    sessionState,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    saveSession,
    refetch
  } = useSessions()

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

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

  // アクティブなセッションがある場合の自動遷移（アプリ初回起動時のみ）
  useEffect(() => {
    // アプリが初めて起動されたか（リロードや直接アクセス）を判定
    const isAppStartup = !sessionStorage.getItem('app-started')
    
    if (isInitialized && isSessionActive && currentSession && isAppStartup) {
      router.push('/session')
    }
    
    // アプリが起動したことを記録（セッション中は維持）
    if (isInitialized) {
      sessionStorage.setItem('app-started', 'true')
    }
  }, [isInitialized, isSessionActive, currentSession, router])

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

      // 写真付きセッションの画像を事前にプリロード
      const sessionsWithPhotosIds = sessionsWithPhotos
        .filter(session => session.hasPhotos)
        .slice(0, 5)
        .map(session => session.id)

      if (sessionsWithPhotosIds.length > 0) {
        preloadSessionPhotos(sessionsWithPhotosIds)
      }
    }

    updateSessionsWithPhotos()
  }, [sessions])

  // 写真付きセッションの画像を事前にプリロードする関数
  const preloadSessionPhotos = async (sessionIds: string[]) => {
    try {
      const preloadPromises = sessionIds.map(async (sessionId) => {
        try {
          const photos = await getSessionPhotos(sessionId)
          const imageUrls = photos.map(photo => photo.url)
          
          if (imageUrls.length > 0) {
            return preloadImages(imageUrls)
          }
        } catch (error) {
          // エラーは無視してバックグラウンドプリロードを継続
        }
      })

      await Promise.allSettled(preloadPromises)
    } catch (error) {
      // バックグラウンドプリロードのエラーは無視
    }
  }

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    await startSession(sessionData)
    router.push('/session')
  }

  // セッション詳細表示
  const handleViewSession = () => {
    router.push('/session')
  }

  // セッション終了
  const handleEndSession = () => {
    endSession()
    router.push('/session')
  }

  // 週表示でカレンダーページに遷移
  const handleWeekViewTransition = () => {
    router.push('/calendar?view=week')
  }

  // 一時停止/再開
  const handleTogglePause = () => {
    if (sessionState === "active") {
      pauseSession()
    } else {
      resumeSession()
    }
  }

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
    <>
      {/* ダッシュボードのみ：Header - SPでのみ表示 */}
      <div className="md:hidden">
        <Header currentPage="dashboard" onPageChange={(page) => {
          if (page === 'calendar') router.push('/calendar')
          if (page === 'goals') router.push('/goals')
          if (page === 'settings') router.push('/settings')
        }} />
      </div>
      
      <main className="container mx-auto px-4 py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* メインエリア - 2列分 */}
          <div className="lg:col-span-2">
            {/* SP用：進行中の行動、PC用：非表示 */}
            <div className="lg:hidden mb-4 lg:mb-6">
              <ActiveActivitySidebar
                activeSession={currentSession}
                isActive={isSessionActive}
                onViewSession={handleViewSession}
                onTogglePause={handleTogglePause}
                onEnd={handleEndSession}
                sessionState={sessionState}
              />
            </div>
            
            <AIFeedback completedSessions={completedSessions} />
            <div className="mt-4 lg:mt-6">
              <TimeTracker onStartSession={handleStartSession} completedSessions={completedSessions} />
            </div>
          </div>

          {/* サイドバー - 1列分 */}
          <div className="space-y-4 lg:space-y-6">
            {/* PC用：進行中の行動、SP用：非表示 */}
            <div className="hidden lg:block">
              <ActiveActivitySidebar
                activeSession={currentSession}
                isActive={isSessionActive}
                onViewSession={handleViewSession}
                onTogglePause={handleTogglePause}
                onEnd={handleEndSession}
                sessionState={sessionState}
              />
            </div>
 
            <WeeklyProgress completedSessions={completedSessions} onWeekViewClick={handleWeekViewTransition} />
          </div>
        </div>
      </main>
    </>
  )
} 