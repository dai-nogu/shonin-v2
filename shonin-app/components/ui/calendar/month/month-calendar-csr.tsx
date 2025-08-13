"use client"

import { useState } from "react"
import { CalendarCommon, type CalendarSession } from "@/components/ui/calendar/calendar-common"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface MonthCalendarCSRProps {
  completedSessions: CompletedSession[]
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
}

export function MonthCalendarCSR({ 
  completedSessions, 
  initialDate = new Date(),
  CalendarComponent
}: MonthCalendarCSRProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)

  // 月ナビゲーション
  const handleNavigate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  // 今日へ移動
  const handleTodayClick = () => {
    setCurrentDate(new Date())
  }

  // 日付クリック処理（月特有の形式）
  const handleDateClick = (date: number, sessions: CalendarSession[]) => {
    // 共通コンポーネント内で処理されるため、ここでは何もしない
    // 実際の処理は CalendarCommon 内で行われる
  }

  return (
    <CalendarCommon
      completedSessions={completedSessions}
      initialDate={initialDate}
      CalendarComponent={CalendarComponent}
      viewMode="month"
      onNavigate={handleNavigate}
      onTodayClick={handleTodayClick}
      onDateClick={handleDateClick}
      currentDate={currentDate}
    />
  )
} 