"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ActiveSession } from "@/components/active-session"
import { useSessions } from "@/contexts/sessions-context"
import { clientLogger } from "@/lib/client-logger"
import type { CompletedSession } from "@/components/time-tracker"

export default function SessionPage() {
  const { user, loading: authLoading } = useAuth()
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

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // セッションがない場合はダッシュボードに戻る
  useEffect(() => {
    if (!authLoading && user && !isSessionActive) {
      router.push('/dashboard')
    }
  }, [user, authLoading, isSessionActive, router])

  // セッション終了
  const handleEndSession = () => {
    endSession()
    // セッション終了後も現在のページに留まって終了画面を表示
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await saveSession(sessionData)
      router.push('/dashboard') // ダッシュボードに戻る
      return sessionId
    } catch (error) {
      clientLogger.error("セッション保存エラー:", error)
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

  // 未認証の場合は何も表示しない
  if (!user) {
    return null
  }

  // セッションがない場合は何も表示しない（useEffectでダッシュボードに戻る）
  if (!isSessionActive || !currentSession) {
    return null
  }

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