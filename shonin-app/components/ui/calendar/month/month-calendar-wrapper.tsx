"use client"

import { MonthCalendarView } from "./month-calendar-view"
import { useSessionList } from "@/hooks/useSessionList"
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode"
import { useSubscriptionContext } from "@/contexts/subscription-context"

export function MonthCalendarWrapper() {
  const { completedSessions } = useSessionList()
  const { userPlan } = useSubscriptionContext()
  
  const { 
    currentDate, 
    onNavigate, 
    onTodayClick, 
    showPlanLimitModal, 
    setShowPlanLimitModal 
  } = useCalendarViewMode({
    userPlan,
    viewMode: 'month',
  })

  return (
    <MonthCalendarView
      currentDate={currentDate}
      completedSessions={completedSessions}
      onNavigate={onNavigate}
      onTodayClick={onTodayClick}
      showPlanLimitModal={showPlanLimitModal}
      setShowPlanLimitModal={setShowPlanLimitModal}
    />
  )
}

