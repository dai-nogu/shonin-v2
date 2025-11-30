"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"
import { useToast } from "@/contexts/toast-context"
import { ActiveSession } from "@/components/ui/dashboard/active-session"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

export default function SessionPage() {
  const router = useRouter()
  const { showError } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const t = useTranslations()
  const tCommon = useTranslations("common")
  const tActiveSession = useTranslations("active_session")
  const tSessionPage = useTranslations("session_page")

  // セッションコンテキストから状態を取得
  const {
    currentSession,
    isSessionActive,
    sessionState,
    endSession,
    pauseSession,
    resumeSession,
    saveSession,
    loading
  } = useSessions()

  // 注意: 自動リダイレクトは行わない
  // セッションが存在しない場合でも、ユーザーが明示的に保存ボタンを押した時のみダッシュボードに戻る

  // セッション終了
  const handleEndSession = () => {
    endSession()
    // 終了後もセッションページに留まり、保存画面を表示
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      setIsSaving(true)
      const sessionId = await saveSession(sessionData)
      // 保存完了後にダッシュボードに戻る
      router.push('/dashboard')
      return sessionId
    } catch (error) {
      setIsSaving(false)
      showError(tSessionPage('save_failed'))
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

  // 復元中または保存中はローディング表示
  if (loading || isSaving) {
    return (
      <>
        <AppSidebar currentPage="dashboard" />
        <SidebarInset>
          <div className="min-h-screen bg-gray-950 text-white pb-20 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
              <p className="text-gray-400">
                {isSaving ? tActiveSession('recording') : tCommon('loading')}
              </p>
            </div>
          </div>
        </SidebarInset>
        <BottomNavigation currentPage="dashboard" />
      </>
    )
  }

  // セッションが存在しない場合は、セッションが見つからない旨を表示
  if (!isSessionActive || !currentSession) {
    return (
      <>
        <AppSidebar currentPage="dashboard" />
        <SidebarInset>
          <div className="min-h-screen bg-gray-950 text-white pb-20">
            <div className="container mx-auto px-4 py-4 lg:py-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">{tSessionPage('not_found_title')}</h1>
                <p className="text-gray-400 mb-6">{tSessionPage('not_found_description')}</p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  {tSessionPage('back_to_dashboard')}
                </button>
              </div>
            </div>
          </div>
        </SidebarInset>
        <BottomNavigation currentPage="dashboard" />
      </>
    )
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