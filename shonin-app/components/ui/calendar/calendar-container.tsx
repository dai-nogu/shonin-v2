"use client"

import { useState } from "react"
import { useLocale } from 'next-intl'
import { formatDateForLocale } from '@/lib/i18n-utils'
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import type { CalendarSession } from "@/lib/calendar-utils"
import { CalendarViewToggle } from "./calendar-view-toggle"
import { DateSessionsModal } from "./date-sessions-modal"

export type { CalendarSession }

interface CalendarContainerProps {
  completedSessions: CompletedSession[]
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
  viewMode: "month" | "week"
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick?: (date: any, sessions: CalendarSession[]) => void
  currentDate: Date
  userPlan?: 'free' | 'standard' | 'premium'
  subscriptionLoading?: boolean
}

export function CalendarContainer({
  completedSessions,
  initialDate = new Date(),
  CalendarComponent,
  viewMode,
  onNavigate,
  onTodayClick,
  currentDate,
  userPlan = 'free',
  subscriptionLoading = false
}: CalendarContainerProps) {
  const locale = useLocale()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [modalSessions, setModalSessions] = useState<CalendarSession[]>([])

  // 日付クリック時の処理
  const handleDateClick = (date: any, sessions: CalendarSession[]) => {
    // セッションが3つ以上の場合のみモーダルを表示
    if (sessions.length < 3) {
      return
    }
    
    // 日付文字列のフォーマット（月と週で異なる）
    let dateStr: string
    if (viewMode === "month" && typeof date === "number") {
      const slashFormatDate = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${date}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else if (viewMode === "week" && date instanceof Date) {
      const slashFormatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else {
      dateStr = "Invalid Date"
    }
    
    setModalDate(dateStr)
    setModalSessions(sessions)
    setIsModalOpen(true)
  }

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        {/* 月/週切り替えボタン */}
        <CalendarViewToggle viewMode={viewMode} />

        {/* カレンダーコンポーネント */}
        <CalendarComponent
          currentDate={currentDate}
          completedSessions={completedSessions}
          onNavigate={onNavigate}
          onTodayClick={onTodayClick}
          onDateClick={handleDateClick}
          userPlan={userPlan}
          subscriptionLoading={subscriptionLoading}
        />
      </div>

      {/* 日付別セッションモーダル */}
      <DateSessionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={modalDate}
        sessions={modalSessions}
        completedSessions={completedSessions}
      />
    </div>
  )
} 