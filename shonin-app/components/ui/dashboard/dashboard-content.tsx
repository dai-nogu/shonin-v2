"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'
import { ErrorModal } from "@/components/ui/common/error-modal"
import { useSessions } from "@/contexts/sessions-context"
import { useSessionList } from "@/hooks/useSessionList"
import { useSessionPhotos } from "@/hooks/useSessionPhotos"
import { TodayTimeChart } from "./sections/today-time-chart"
import { ActivitySelector } from "./activity-selector"
import { WeeklyLineChart } from "./sections/weekly-line-chart"
import { LetterSection } from "./sections/letter-section"
import { QuickStart } from "./quick-start"
import type { SessionData } from "./time-tracker"
import type { Database } from '@/types/database'

type DbGoal = Database['public']['Tables']['goals']['Row']

interface DashboardContentProps {
  initialGoals?: DbGoal[]
}

export function DashboardContent({ initialGoals }: DashboardContentProps) {
  const router = useRouter()
  const t = useTranslations()
  const [operationError, setOperationError] = useState<string | null>(null)
  
  // セッション一覧取得フック
  const { completedSessions, setCompletedSessions } = useSessionList()
  
  // 写真処理フック
  useSessionPhotos({ completedSessions, setCompletedSessions })

  // セッションコンテキストから状態を取得
  const { startSession } = useSessions()

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    try {
      await startSession(sessionData)
      router.push("/session")
    } catch (error) {
      setOperationError(t('errors.session_start_failed'))
    }
  }

  return (
    <>
      {/* エラーモーダル */}
      <ErrorModal
        isOpen={!!operationError}
        onClose={() => setOperationError(null)}
        message={operationError || ''}
      />

      {/* 3カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: セッション開始 + 今日の時間チャート */}
        <div className="space-y-6">
          {/* 1. Start（左上）: 即座に表示 */}
          <div className="opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]">
            <ActivitySelector onStart={handleStartSession} />
          </div>
          {/* 4. Today's Time（左下）: 1.2秒後 */}
          <div className="opacity-0 animate-[fadeIn_0.4s_ease-out_1.2s_forwards]">
            <TodayTimeChart completedSessions={completedSessions} />
          </div>
        </div>

        {/* 中央カラム: クイックスタート + 週間進捗チャート */}
        <div className="space-y-6">
          {/* 2. History（中央上）: 0.4秒後 */}
          <div className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.4s_forwards]">
            <QuickStart 
              completedSessions={completedSessions} 
              onStartActivity={handleStartSession}
            />
          </div>
          {/* 5. Progress（中央下）: 1.6秒後（最後） */}
          <div className="opacity-0 animate-[fadeIn_0.4s_ease-out_1.6s_forwards]">
            <WeeklyLineChart completedSessions={completedSessions} />
          </div>
        </div>

        {/* 右カラム: 手紙(Letter) */}
        <div className="space-y-6">
          {/* 3. Weekly letter（右上）: 0.8秒後 */}
          <div className="opacity-0 animate-[fadeIn_0.4s_ease-out_0.8s_forwards]">
            <LetterSection completedSessions={completedSessions} />
          </div>
        </div>
      </div>
    </>
  )
}
