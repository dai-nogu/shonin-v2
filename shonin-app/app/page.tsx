"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { TimeTracker } from "@/components/time-tracker"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { ActiveSession } from "@/components/active-session"
import { CalendarView } from "@/components/calendar-view"
import { Goals } from "@/components/goals"
import { Settings } from "@/components/settings"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"
import { hasSessionPhotosMultiple, preloadImages, getSessionPhotos } from "@/lib/upload-photo"
import type { SessionData, CompletedSession } from "@/components/time-tracker"

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // OAuth認証後のURLクリーンアップ
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // OAuth認証完了後にトークンをURLから除去
      window.history.replaceState(null, '', '/')
    }
  }, [])
  
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  const [isInitialized, setIsInitialized] = useState(false)
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [isGoalEditing, setIsGoalEditing] = useState(false)
  const [isGoalAdding, setIsGoalAdding] = useState(false)

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
    // 未認証の場合はログインページにリダイレクト
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // 初期化処理
  useEffect(() => {
    if (!user) return // 認証済みの場合のみ実行

    const initializeApp = async () => {
      try {
        // ローカルストレージから設定を復元
        const savedViewMode = localStorage.getItem('shonin-calendar-view-mode')
        if (savedViewMode === 'month' || savedViewMode === 'week') {
          setCalendarViewMode(savedViewMode)
        }

        // ページ状態を復元（ダッシュボードを優先）
        const savedPage = localStorage.getItem('shonin-current-page')
        if (savedPage && ['calendar', 'analytics', 'goals', 'settings'].includes(savedPage)) {
          setCurrentPage(savedPage)
        } else {
          setCurrentPage('dashboard') // デフォルトはダッシュボード
        }

        // セッションデータを取得・更新
        await refetch()
        
        setIsInitialized(true)
      } catch (error) {
        console.error('初期化エラー:', error)
        setIsInitialized(true) // エラーが発生しても初期化完了とする
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

      // 完了したセッションのみをフィルタリング
      const completedSessionsData = sessions.filter(session => session.end_time)
      
      if (completedSessionsData.length === 0) {
        setCompletedSessions([])
        return
      }

      // セッションIDの配列を作成
      const sessionIds = completedSessionsData.map(session => session.id)
      
      // 写真の有無を一括確認
      const photoStatusMap = await hasSessionPhotosMultiple(sessionIds)

      // CompletedSessionの型に合わせて変換（写真の有無を含む）
      const sessionsWithPhotos: CompletedSession[] = completedSessionsData.map(session => ({
        id: session.id,
        activityId: session.activity_id,
        activityName: session.activities?.name || '不明',
        startTime: new Date(session.start_time),
        endTime: new Date(session.end_time!),
        duration: session.duration,
        sessionDate: session.session_date || undefined, // データベースのsession_dateを設定
        location: session.location || '',
        notes: session.notes || '',
        mood: session.mood || undefined,
        achievements: session.achievements || undefined,
        challenges: session.challenges || undefined,
        // 行動の色とアイコン情報を追加
        activityColor: session.activities?.color,
        activityIcon: session.activities?.icon || undefined,
        // 目標IDを追加
        goalId: session.goal_id || undefined,
        // 写真の有無を設定
        hasPhotos: photoStatusMap[session.id] || false
      }))

      setCompletedSessions(sessionsWithPhotos)

      // 写真付きセッションの画像を事前にプリロード（バックグラウンドで実行）
      const sessionsWithPhotosIds = sessionsWithPhotos
        .filter(session => session.hasPhotos)
        .slice(0, 5) // 最新5件の写真付きセッションのみプリロード
        .map(session => session.id)

      if (sessionsWithPhotosIds.length > 0) {
        // バックグラウンドでプリロード（非同期で実行、状態変更を避ける）
        preloadSessionPhotos(sessionsWithPhotosIds)
      }
    }

    updateSessionsWithPhotos()
  }, [sessions])

  // 写真付きセッションの画像を事前にプリロードする関数
  const preloadSessionPhotos = async (sessionIds: string[]) => {
    try {
      // 各セッションの写真を並列で取得してプリロード
      const preloadPromises = sessionIds.map(async (sessionId) => {
        try {
          const photos = await getSessionPhotos(sessionId)
          const imageUrls = photos.map(photo => photo.url)
          
          if (imageUrls.length > 0) {
            // バックグラウンドでプリロード（エラーが発生しても無視）
            return preloadImages(imageUrls)
          }
        } catch (error) {
          // エラーは無視してバックグラウンドプリロードを継続
        }
      })

      // 全てのプリロードを並列実行（エラーは無視）
      await Promise.allSettled(preloadPromises)
    } catch (error) {
      // バックグラウンドプリロードのエラーは無視
    }
  }

  // カレンダー表示モードの保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('shonin-calendar-view-mode', calendarViewMode)
    }
  }, [calendarViewMode, isInitialized])

  // 現在のページ状態を保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      // セッションページは保存しない（セッション状態に依存するため）
      if (currentPage !== "session") {
        localStorage.setItem('shonin-current-page', currentPage)
      }
    }
  }, [currentPage, isInitialized])

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const handleWeekViewTransition = () => {
    setCalendarViewMode("week")
    setCurrentPage("calendar")
  }

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    await startSession(sessionData)
    setCurrentPage("session") // セッション専用ページに遷移
  }

  // セッション終了
  const handleEndSession = () => {
    endSession()
    setCurrentPage("session") // 終了画面に遷移
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await saveSession(sessionData)
      setCurrentPage("dashboard") // ダッシュボードに戻る
      return sessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      // エラーハンドリング - 必要に応じてユーザーに通知
      return null
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    setCurrentPage("session")
  }

  // 目標管理画面への遷移
  const handleGoalSettingClick = () => {
    setCurrentPage("goals")
  }

  // 一時停止/再開
  const handleTogglePause = () => {
    if (sessionState === "active") {
      pauseSession()
    } else {
      resumeSession()
    }
  }

  // セッション再開（終了状態からアクティブ状態に戻る）
  const handleResumeSession = () => {
    resumeSession()
  }

  // セッション画面でセッションが存在しない場合にダッシュボードに戻る
  useEffect(() => {
    if (currentPage === "session" && !isSessionActive) {
      setCurrentPage("dashboard")
    }
  }, [currentPage, isSessionActive])

  // リロード時のみ：アクティブなセッションがある場合はセッションページに遷移
  // ユーザーが意図的に他のページに遷移した場合は強制的に戻さない
  useEffect(() => {
    // 初期化完了時かつページリロード時のみセッションページに遷移
    if (isInitialized && isSessionActive && currentSession && currentPage === "dashboard") {
      // ダッシュボードにいる場合のみセッションページに遷移
      setCurrentPage("session")
    }
  }, [isInitialized, isSessionActive, currentSession])

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

  // 未認証の場合は何も表示しない（ログインページにリダイレクトされる）
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

    const renderContent = () => {
    switch (currentPage) {
      case "session":
        if (isSessionActive && currentSession) {
          return (
            <ActiveSession 
              session={currentSession} 
              onEnd={handleEndSession} 
              onSave={handleSaveSession}
              sessionState={sessionState}
              onTogglePause={handleTogglePause}
              onResume={handleResumeSession}
            />
          )
        }
        // セッションがない場合は何も表示しない（useEffectでダッシュボードに戻る）
        return null
        
      case "calendar":
        return (
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <CalendarView 
              viewMode={calendarViewMode} 
              onViewModeChange={setCalendarViewMode} 
              completedSessions={completedSessions}
            />
          </main>
        )
        
      case "analytics":
        return (
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">統計・分析</h1>
            </div>
            <div className="p-8 text-center text-gray-400">統計・分析ページ（開発中）</div>
          </main>
        )
        
      case "goals":
        return (
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Goals 
              onBack={() => setCurrentPage("dashboard")} 
              onEditingChange={setIsGoalEditing}
              onAddingChange={setIsGoalAdding}
            />
          </main>
        )
        
      case "settings":
        return (
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Settings 
              onBack={() => setCurrentPage("dashboard")} 
              currentSession={currentSession ? {
                activityId: currentSession.activityId,
                activityName: currentSession.activityName
              } : null}
              isSessionActive={isSessionActive}
            />
          </main>
        )
        

      default:
        return (
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* メインエリア - 2列分 */}
              <div className="lg:col-span-2">
                {/* SP用：WelcomeCardを最初に表示、PC用：非表示 */}
                <div className="lg:hidden mb-4 lg:mb-6">
                  <WelcomeCard completedSessions={completedSessions} />
                </div>
                
                {/* SP用：進行中の行動をWelcomeCardの下に表示、PC用：非表示 */}
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
                  <TimeTracker onStartSession={handleStartSession} completedSessions={completedSessions} onGoalSettingClick={handleGoalSettingClick} />
                </div>
              </div>

              {/* サイドバー - 1列分 */}
              <div className="space-y-4 lg:space-y-6">
                {/* PC用：WelcomeCardを表示、SP用：非表示 */}
                <div className="hidden lg:block">
                  <WelcomeCard completedSessions={completedSessions} />
                </div>
                
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
        )
    }
  }

  return (
    <>
      {/* 目標編集中・追加中はサイドバーを非表示 */}
      {!(currentPage === "goals" && (isGoalEditing || isGoalAdding)) && (
        <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
      )}
      <SidebarInset>
        <div className={`md:min-h-screen bg-gray-950 text-white md:pb-0 ${
          currentPage === "goals" && (isGoalEditing || isGoalAdding) ? "pb-0" : "pb-20"
        }`}>
          {/* ダッシュボードのみ：Header - SPでのみ表示 */}
          {currentPage === "dashboard" && (
            <div className="md:hidden">
              <Header currentPage={currentPage} onPageChange={handlePageChange} />
            </div>
          )}
          {renderContent()}
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション - 目標編集中・追加中は非表示 */}
      {!(currentPage === "goals" && (isGoalEditing || isGoalAdding)) && (
        <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      )}
    </>
  )
} 