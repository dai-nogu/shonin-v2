"use client"

import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CalendarView } from "@/components/calendar-view"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSessionList } from "@/hooks/useSessionList"

export default function CalendarWeekPage() {
  const router = useRouter()
  // セッション一覧取得フック
  const { user, isInitialized, completedSessions } = useSessionList()

  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <CalendarView 
              viewMode="week"
              onViewModeChange={(mode) => {
                // 月表示に切り替える場合は/calendar/monthに遷移
                if (mode === "month") {
                  router.push("/calendar/month")
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