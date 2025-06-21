"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { TodaysStats } from "@/components/todays-stats"
import { WeeklyProgress } from "@/components/weekly-progress"
import { GoalProgress } from "@/components/goal-progress"
import { TimeTracker } from "@/components/time-tracker"
import { CalendarView } from "@/components/calendar-view"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const handleWeekViewTransition = () => {
    setCalendarViewMode("week")
    setCurrentPage("calendar")
  }

  const renderContent = () => {
    switch (currentPage) {
      case "calendar":
        return <CalendarView viewMode={calendarViewMode} onViewModeChange={setCalendarViewMode} />
      case "analytics":
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">統計・分析</h1>
            </div>
            <div className="p-8 text-center text-gray-400">統計・分析ページ（開発中）</div>
          </div>
        )
      case "goals":
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">目標管理</h1>
            </div>
            <div className="p-8 text-center text-gray-400">目標管理ページ（開発中）</div>
          </div>
        )
      case "settings":
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">設定</h1>
            </div>
            <div className="p-8 text-center text-gray-400">設定ページ（開発中）</div>
          </div>
        )
      default:
        return (
          <>
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* メインエリア - 2列分 */}
                <div className="lg:col-span-2 space-y-6">
                  <WelcomeCard />
                  <TimeTracker />
                </div>

                {/* サイドバー - 1列分 */}
                <div className="space-y-6">
                  <TodaysStats />
                  <WeeklyProgress onWeekViewClick={handleWeekViewTransition} />
                  <GoalProgress />
                </div>
              </div>
            </main>
          </>
        )
    }
  }

  return (
    <>
      <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <SidebarInset>
        <div className="min-h-screen bg-gray-950 text-white">
          {renderContent()}
        </div>
      </SidebarInset>
    </>
  )
}
