"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { TimeTracker } from "@/components/time-tracker"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { ActiveSession } from "@/components/active-session"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"
import { useSessionPhotos } from "@/hooks/useSessionPhotos"
import type { SessionData, CompletedSession } from "@/components/time-tracker"

export default function DashboardPage() {
  const router = useRouter()
  
  // セッション一覧取得フック
  const { user, isInitialized, completedSessions, setCompletedSessions } = useSessionList()
  
  // 写真処理フック（Dashboard専用）
  useSessionPhotos({ completedSessions, setCompletedSessions })

  const [currentPage, setCurrentPage] = useState("dashboard")

  // セッションコンテキストから状態を取得
  const {
    loading,
    error,
    currentSession,
    isSessionActive,
    sessionState,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    saveSession
  } = useSessions()





  const handleWeekViewTransition = () => {
    router.push("/calendar?view=week")
  }

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    await startSession(sessionData)
    setCurrentPage("session")
  }

  // セッション終了
  const handleEndSession = () => {
    endSession()
    setCurrentPage("session")
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await saveSession(sessionData)
      setCurrentPage("dashboard")
      return sessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      return null
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    setCurrentPage("session")
  }

  // 目標管理画面への遷移
  const handleGoalSettingClick = () => {
    router.push("/goals")
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

  // アクティブなセッションがある場合はセッションページに遷移
  useEffect(() => {
    if (isInitialized && isSessionActive && currentSession && currentPage === "dashboard") {
      setCurrentPage("session")
    }
  }, [isInitialized, isSessionActive, currentSession])



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
    if (currentPage === "session") {
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
      return null
    }
    
    // ダッシュボードコンテンツ
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

  return (
    <>
      <AppSidebar currentPage={currentPage} />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          {/* Header - SPでのみ表示 */}
          <div className="md:hidden">
            <Header currentPage={currentPage} />
          </div>
          {renderContent()}
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage={currentPage} />
    </>
  )
} 