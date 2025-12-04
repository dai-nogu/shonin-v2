"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { TimeTracker } from "./time-tracker"
import { ActiveActivitySidebar } from "./active-activity-sidebar"
import { Button } from "@/components/ui/common/button"
import { ErrorModal } from "@/components/ui/common/error-modal"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"
import { useSessionPhotos } from "@/hooks/useSessionPhotos"
import type { SessionData } from "./time-tracker"
import type { SessionWithActivity } from "@/hooks/use-sessions-db"

interface DashboardMainContentProps {
  initialCompletedSessions?: SessionWithActivity[]
  user: any
}

export function DashboardMainContent({ initialCompletedSessions, user }: DashboardMainContentProps) {
  const router = useRouter()
  const t = useTranslations()
  const [operationError, setOperationError] = useState<string | null>(null)
  
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

      setOperationError(t('errors.session_start_failed'))
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    router.push("/session")
  }

  return (
    <>
      {/* エラーモーダル */}
      <ErrorModal
        isOpen={!!operationError}
        onClose={() => {
          // エラーステートをクリアしてモーダルを閉じる
          setOperationError(null)
        }}
        message={operationError || ''}
      />

      {/* SP用：進行中の行動、PC用：非表示 */}
      {isSessionActive && (
        <div className="lg:hidden mb-4 lg:mb-6">
          <ActiveActivitySidebar
            activeSession={currentSession}
            isActive={isSessionActive}
            onViewSession={handleViewSession}
            onTogglePause={() => {}} // 暫定：セッションページで処理
            onEnd={() => {}} // 暫定：セッションページで処理
            sessionState="active" // 暫定：実際の値は不要
            isDashboard={true} // ダッシュボード表示モード
          />
        </div>
      )}
      
      <div className="space-y-6">
        {/* グリッドレイアウトを採用 */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <TimeTracker onStartSession={handleStartSession} completedSessions={completedSessions} />
        </div>
      </div>
    </>
  )
} 