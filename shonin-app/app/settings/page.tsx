"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Settings } from "@/components/settings"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessions } from "@/contexts/sessions-context"

export default function SettingsPage() {
  const router = useRouter()

  // セッションコンテキストから状態を取得
  const {
    currentSession,
    isSessionActive
  } = useSessions()

  const handleBack = () => {
    router.push("/dashboard")
  }



  return (
    <>
      <AppSidebar currentPage="settings" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
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
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="settings" />
    </>
  )
} 