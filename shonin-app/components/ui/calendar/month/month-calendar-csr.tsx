"use client"

import { CalendarContainer, type CalendarSession } from "@/components/ui/calendar/calendar-container"
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode"
import { useSessionList } from "@/hooks/useSessionList"
import { useSubscription } from "@/hooks/use-subscription"
import { PlanLimitModal } from "@/components/ui/calendar/plan-limit-modal"

interface MonthCalendarProps {
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
}

export function MonthCalendarCSR({ initialDate, CalendarComponent }: MonthCalendarProps) {
  const { userPlan, loading: subscriptionLoading } = useSubscription()
  const { 
    currentDate, 
    onNavigate, 
    onTodayClick, 
    showPlanLimitModal, 
    setShowPlanLimitModal 
  } = useCalendarViewMode({
    initialDate,
    userPlan,
    viewMode: 'month',
  })
  const { completedSessions } = useSessionList()

  return (
    <>
      <CalendarContainer
        completedSessions={completedSessions}
        initialDate={initialDate}
        CalendarComponent={CalendarComponent}
        viewMode="month"
        onNavigate={onNavigate}
        onTodayClick={onTodayClick}
        currentDate={currentDate}
        userPlan={userPlan}
        subscriptionLoading={subscriptionLoading}
      />
      <PlanLimitModal
        isOpen={showPlanLimitModal}
        onClose={() => setShowPlanLimitModal(false)}
      />
    </>
  )
} 