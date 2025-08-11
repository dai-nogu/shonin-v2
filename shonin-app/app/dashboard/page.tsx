"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { TimeTracker } from "@/components/time-tracker"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"
import { useSessionPhotos } from "@/hooks/useSessionPhotos"
import type { SessionData } from "@/components/time-tracker"

export default function DashboardPage() {
  const router = useRouter()
  
  // セッション一覧取得フック
  const { user, isInitialized, completedSessions, setCompletedSessions } = useSessionList()
  
  // 写真処理フック（Dashboard専用）
  useSessionPhotos({ completedSessions, setCompletedSessions })

  // セッションコンテキストから状態を取得
  const {
    loading,
    error,
    currentSession,
    isSessionActive,
    startSession
  } = useSessions()





  const handleWeekViewTransition = () => {
    router.push("/calendar/week")
  }

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    try {
      await startSession(sessionData)
      // セッション開始直後に専用ページに遷移
      router.push("/session")
    } catch (error) {
      console.error("セッション開始エラー:", error)
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    router.push("/session")
  }

  // 目標管理画面への遷移
  const handleGoalSettingClick = () => {
    router.push("/goals")
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

  // ダッシュボードコンテンツ
  const renderContent = () => {
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
                    onTogglePause={() => {}} // 暫定：セッションページで処理
                    onEnd={() => {}} // 暫定：セッションページで処理
                    sessionState="active" // 暫定：実際の値は不要
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
                    onTogglePause={() => {}} // 暫定：セッションページで処理
                    onEnd={() => {}} // 暫定：セッションページで処理
                    sessionState="active" // 暫定：実際の値は不要
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
      <AppSidebar currentPage="dashboard" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          {/* Header - SPでのみ表示 */}
          <div className="md:hidden">
            <Header currentPage="dashboard" />
          </div>
          {renderContent()}
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="dashboard" />
    </>
  )
} 