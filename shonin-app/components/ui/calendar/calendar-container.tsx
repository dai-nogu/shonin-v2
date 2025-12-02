"use client"

import { useState, useEffect } from "react"
import { useTimezone } from "@/contexts/timezone-context"
import { useTranslations, useLocale } from 'next-intl'
import { formatDateForLocale } from '@/lib/i18n-utils'
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import type { CalendarSession } from "@/lib/calendar-utils"
import { CalendarViewToggle } from "./calendar-view-toggle"
import { SessionDetailModal } from "./session-detail-modal"
import { MobileSessionPanel } from "./mobile-session-panel"

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
  onDateClick,
  currentDate,
  userPlan = 'free',
  subscriptionLoading = false
}: CalendarContainerProps) {
  const { timezone } = useTimezone()
  const t = useTranslations()
  const locale = useLocale()
  const [selectedDateSessions, setSelectedDateSessions] = useState<CalendarSession[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)
  
  // SP版用の下部表示状態
  const [showBottomPanel, setShowBottomPanel] = useState(false)
  const [bottomPanelDate, setBottomPanelDate] = useState<string>("")
  const [bottomPanelSessions, setBottomPanelSessions] = useState<CalendarSession[]>([])

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 内部で使用する日付クリック処理
  const handleInternalDateClick = (date: any, sessions: CalendarSession[]) => {
    setSelectedDateSessions(sessions)
    
    // 日付文字列のフォーマット（月と週で異なる）
    let dateStr: string
    if (viewMode === "month" && typeof date === "number") {
      // 月表示の場合
      const slashFormatDate = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${date}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else if (viewMode === "week" && date instanceof Date) {
      // 週表示の場合
      const slashFormatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else {
      dateStr = "Invalid Date"
    }
    
    if (isMobile) {
      // SP版：下部パネルを表示
      setBottomPanelDate(dateStr)
      setBottomPanelSessions(sessions)
      setShowBottomPanel(true)
    } else if (viewMode === "week" ? sessions.length > 2 : true) {
      // PC版：週表示では3つ以上、月表示では常にモーダルを表示
      setModalDate(dateStr)
      setIsModalOpen(true)
    }
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
          timezone={timezone}
          onNavigate={onNavigate}
          onTodayClick={onTodayClick}
          onDateClick={handleInternalDateClick}
          userPlan={userPlan}
          subscriptionLoading={subscriptionLoading}
        />
        
        {/* SP版用：下部パネル */}
        <MobileSessionPanel
          isVisible={showBottomPanel && isMobile}
          date={bottomPanelDate}
          sessions={bottomPanelSessions}
        />
      </div>

      {/* セッション詳細モーダル（PC版） */}
      <SessionDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={modalDate}
        sessions={selectedDateSessions}
        completedSessions={completedSessions}
      />
    </div>
  )
} 