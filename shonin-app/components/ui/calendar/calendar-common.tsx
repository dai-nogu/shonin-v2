// カレンダーのUI変更

"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/common/button"
import { Calendar } from "lucide-react"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import type { CalendarSession } from "@/lib/calendar-utils"

export type { CalendarSession }

interface CalendarCommonProps {
  completedSessions: CompletedSession[]
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
  viewMode: "month" | "week"
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick?: (date: any, sessions: CalendarSession[]) => void
  currentDate: Date
}

export function CalendarCommon({
  completedSessions,
  initialDate = new Date(),
  CalendarComponent,
  viewMode,
  onNavigate,
  onTodayClick,
  currentDate
}: CalendarCommonProps) {
  const router = useRouter()

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        {/* 月/週切り替えボタン */}
        <div className="bg-gray-900 px-2 md:px-4 pt-6 pb-3">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => router.push("/calendar/month")}
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className={
                viewMode === "month"
                  ? "bg-emerald-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              月表示
            </Button>
            <Button
              onClick={() => router.push("/calendar/week")}
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className={
                viewMode === "week"
                  ? "bg-emerald-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              週表示
            </Button>
          </div>
        </div>

        {/* カレンダーコンポーネント */}
        <CalendarComponent
          currentDate={currentDate}
          completedSessions={completedSessions}
          timezone={timezone}
          onNavigate={onNavigate}
          onTodayClick={onTodayClick}
        />
      </div>
    </div>
  )
}
 