"use client"

import { CalendarContainer, type CalendarSession } from "@/components/ui/calendar/calendar-container"
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode"
import { useSessionList } from "@/hooks/useSessionList"

interface WeekCalendarProps {
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
}

export function WeekCalendarCSR({ initialDate, CalendarComponent }: WeekCalendarProps) {
  const { currentDate, onNavigate, onTodayClick } = useCalendarViewMode(initialDate)
  const { completedSessions } = useSessionList()

  return (
    <CalendarContainer
      completedSessions={completedSessions}
      initialDate={initialDate}
      CalendarComponent={CalendarComponent}
      viewMode="week"
      onNavigate={onNavigate}
      onTodayClick={onTodayClick}
      currentDate={currentDate}
    />
  )
} 