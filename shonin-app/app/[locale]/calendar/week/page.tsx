// カレンダー週ページ - サーバーコンポーネント

import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { WeekCalendarWrapper } from "@/components/ui/calendar/week/week-calendar-wrapper"

export default function CalendarWeekPage() {
  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-2 md:px-4 py-4 lg:py-8">
            <WeekCalendarWrapper />
          </main>
        </div>
      </SidebarInset>
      <BottomNavigation currentPage="calendar" />
    </>
  )
} 