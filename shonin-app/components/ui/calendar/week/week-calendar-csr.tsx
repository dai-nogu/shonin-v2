"use client"

import { useState } from "react"
import { CalendarCommon, type CalendarSession } from "@/components/ui/calendar/calendar-common"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface WeekCalendarCSRProps {
  completedSessions: CompletedSession[]
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
}

export function WeekCalendarCSR({ 
  completedSessions, 
  initialDate = new Date(),
  CalendarComponent
}: WeekCalendarCSRProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)

  // 週ナビゲーション
  const handleNavigate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

  // 今週へ移動
  const handleTodayClick = () => {
    setCurrentDate(new Date())
  }

  // 日付クリック処理（週特有の形式）
  const handleDateClick = (date: Date, sessions: CalendarSession[]) => {
    // 共通コンポーネント内で処理されるため、ここでは何もしない
    // 実際の処理は CalendarCommon 内で行われる
  }

  return (
    <CalendarCommon
      completedSessions={completedSessions}
      initialDate={initialDate}
      CalendarComponent={CalendarComponent}
      viewMode="week"
      onNavigate={handleNavigate}
      onTodayClick={handleTodayClick}
      onDateClick={handleDateClick}
      currentDate={currentDate}
    />
  )
} 