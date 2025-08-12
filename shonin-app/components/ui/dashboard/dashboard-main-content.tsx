"use client"

import { useRouter } from "next/navigation"
import { WelcomeCard } from "./welcome-card"
import { TimeTracker } from "./time-tracker"
import { ActiveActivitySidebar } from "./active-activity-sidebar"
import { AIFeedback } from "./ai-feedback"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"
import { useSessionPhotos } from "@/hooks/useSessionPhotos"
import type { SessionData } from "./time-tracker"

interface DashboardMainContentProps {
  initialCompletedSessions: any[]
  user: any
}

export function DashboardMainContent({ initialCompletedSessions, user }: DashboardMainContentProps) {
  const router = useRouter()
  
  // セッション一覧取得フック
  const { user: currentUser, isInitialized, completedSessions, setCompletedSessions } = useSessionList()
  
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

  return (
    <>
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
    </>
  )
} 