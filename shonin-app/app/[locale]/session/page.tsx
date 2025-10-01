"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
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
      const sessionId = await saveSession(sessionData)
      // 保存完了後にダッシュボードに戻る
      router.push('/dashboard')
      return sessionId
    } catch (error) {
      showError('保存に失敗しました')
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

  // 復元中は何も表示しない
  if (loading) {
    return null
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
                <h1 className="text-2xl font-bold mb-4">セッションが見つかりません</h1>
                <p className="text-gray-400 mb-6">アクティブなセッションがありません。</p>
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                >
                  ダッシュボードに戻る
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