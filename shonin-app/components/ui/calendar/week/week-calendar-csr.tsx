"use client"

import { CalendarContainer, type CalendarSession } from "@/components/ui/calendar/calendar-container"
import { useCalendarViewMode } from "@/hooks/useCalendarViewMode"
import { useSessionList } from "@/hooks/useSessionList"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { PlanLimitModal } from "@/components/ui/calendar/plan-limit-modal"

interface WeekCalendarProps {
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
}

export function WeekCalendarCSR({ initialDate, CalendarComponent }: WeekCalendarProps) {
  const { userPlan, loading: subscriptionLoading } = useSubscriptionContext()
  const { 
    currentDate, 
    onNavigate, 
    onTodayClick, 
    showPlanLimitModal, 
    setShowPlanLimitModal 
  } = useCalendarViewMode({
    initialDate,
    userPlan,
    viewMode: 'week',
  })
  const { completedSessions } = useSessionList()

  return (
    <>
      <CalendarContainer
        completedSessions={completedSessions}
        initialDate={initialDate}
        CalendarComponent={CalendarComponent}
        viewMode="week"
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