"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Settings } from "@/components/settings"
import { useSessions } from "@/contexts/sessions-context"

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  // セッションコンテキストから状態を取得
  const { currentSession, isSessionActive } = useSessions()

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const handleBack = () => {
    router.push('/dashboard')
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

  return (
    <main className="container mx-auto px-4 py-4 lg:py-8">
      <Settings 
        onBack={handleBack} 
        currentSession={currentSession ? {
          activityId: currentSession.activityId,
          activityName: currentSession.activityName
        } : null}
        isSessionActive={isSessionActive}
      />
    </main>
  )
} 