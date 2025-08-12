"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"
import { ActiveSession } from "@/components/ui/dashboard/active-session"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

export default function SessionPage() {
  const router = useRouter()

  // セッションコンテキストから状態を取得
  const {
    currentSession,
    isSessionActive,
    sessionState,
    endSession,
    pauseSession,
    resumeSession,
    saveSession
  } = useSessions()

  // セッションが存在しない場合はダッシュボードに戻る
  useEffect(() => {
    if (!isSessionActive || !currentSession) {
      router.push('/dashboard')
    }
  }, [isSessionActive, currentSession, router])

  // セッション終了
  const handleEndSession = () => {
    endSession()
    // 終了後もセッションページに留まり、保存画面を表示
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await saveSession(sessionData)
      // 保存完了後にダッシュボードに戻る
      router.push('/dashboard')
      return sessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      return null
    }
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

  // セッションが存在しない場合は何も表示しない（リダイレクト処理中）
  if (!isSessionActive || !currentSession) {
    return null
  }

  return (
    <>
      <AppSidebar currentPage="dashboard" />
      <SidebarInset>
        <div className="min-h-screen bg-gray-950 text-white pb-20">
          <div className="container mx-auto px-4 py-4 lg:py-8">
            <ActiveSession 
              session={currentSession} 
              onEnd={handleEndSession} 
              onSave={handleSaveSession}
              sessionState={sessionState}
              onTogglePause={handleTogglePause}
              onResume={handleResumeSession}
            />
          </div>
        </div>
      </SidebarInset>
      <BottomNavigation currentPage="dashboard" />
    </>
  )
} 