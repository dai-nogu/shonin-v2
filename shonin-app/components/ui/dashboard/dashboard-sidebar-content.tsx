"use client"

import { useRouter } from "next/navigation"
import { WelcomeCard } from "./welcome-card"
import { ActiveActivitySidebar } from "./active-activity-sidebar"
import { WeeklyProgress } from "./weekly-progress"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"

interface DashboardSidebarContentProps {
  initialCompletedSessions: any[]
  user: any
}

export function DashboardSidebarContent({ initialCompletedSessions, user }: DashboardSidebarContentProps) {
  const router = useRouter()
  
  // セッション一覧取得フック
  const { completedSessions } = useSessionList()

  // セッションコンテキストから状態を取得
  const {
    currentSession,
    isSessionActive
  } = useSessions()

  const handleWeekViewTransition = () => {
    router.push("/calendar/week")
  }

  // セッション詳細表示
  const handleViewSession = () => {
    router.push("/session")
  }

  return (
    <>
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
    </>
  )
} 