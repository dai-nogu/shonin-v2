"use client"

import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CalendarView } from "@/components/calendar-view"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessionList } from "@/hooks/useSessionList"

export default function CalendarMonthPage() {
  const router = useRouter()
  // セッション一覧取得フック
  const { user, isInitialized, completedSessions } = useSessionList()

  // 初期化が完了するまでローディング表示
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <CalendarView 
              viewMode="month"
              onViewModeChange={(mode) => {
                // 週表示に切り替える場合は/calendar/weekに遷移
                if (mode === "week") {
                  router.push("/calendar/week")
                }
              }}
              completedSessions={completedSessions}
            />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="calendar" />
    </>
  )
} 