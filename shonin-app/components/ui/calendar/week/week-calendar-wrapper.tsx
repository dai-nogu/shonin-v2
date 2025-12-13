"use client"

import { WeekCalendarView } from "./week-calendar-view"
import { useSessionList } from "@/hooks/useSessionList"
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode"
import { useSubscriptionContext } from "@/contexts/subscription-context"

export function WeekCalendarWrapper() {
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
    viewMode: 'week',
  })

  return (
    <WeekCalendarView
      currentDate={currentDate}
      completedSessions={completedSessions}
      onNavigate={onNavigate}
      onTodayClick={onTodayClick}
      showPlanLimitModal={showPlanLimitModal}
      setShowPlanLimitModal={setShowPlanLimitModal}
      userPlan={userPlan}
    />
  )
}

