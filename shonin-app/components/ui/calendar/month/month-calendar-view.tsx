"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/common/card"
import { CalendarHeader } from "@/components/ui/calendar/calendar-header"
import { CalendarStatsCard } from "@/components/ui/calendar/calendar-stats-card"
import { CalendarViewToggle } from "@/components/ui/calendar/calendar-view-toggle"
import { DateSessionsModal } from "@/components/ui/calendar/date-sessions-modal"
import { PlanLimitModal } from "@/components/ui/calendar/plan-limit-modal"
import { useTranslations, useLocale } from 'next-intl'
import { formatDateForLocale } from '@/lib/i18n-utils'
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { 
  convertToCalendarSessions, 
  getDaysInMonth, 
  getSessionsForDate, 
  isToday, 
  getCurrentMonthSessions,
  canViewDate,
  type CalendarSession 
} from "@/lib/calendar-utils"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface MonthCalendarViewProps {
  currentDate: Date
  completedSessions: CompletedSession[]
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  showPlanLimitModal: boolean
  setShowPlanLimitModal: (show: boolean) => void
}

export function MonthCalendarView({
  currentDate,
  completedSessions,
  onNavigate,
  onTodayClick,
  showPlanLimitModal,
  setShowPlanLimitModal
}: MonthCalendarViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const { userPlan } = useSubscriptionContext()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [modalSessions, setModalSessions] = useState<CalendarSession[]>([])
  
  const today = new Date()
  
  // セッションデータの変換（メモ化）
  const sessions = useMemo(() => convertToCalendarSessions(completedSessions), [completedSessions])
  const allDays = useMemo(() => getDaysInMonth(currentDate), [currentDate])
  
  // Freeプランの場合、前月の空白（null）を除外
  const days = useMemo(() => {
    if (userPlan === 'free') {
      return allDays.filter(day => day !== null)
    }
    return allDays
  }, [allDays, userPlan])
  
  // ロケールに応じた年月表示（メモ化）
  const monthName = useMemo(() => 
    locale === 'en' 
      ? currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })
      : currentDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long" }),
    [currentDate, locale]
  )
  
  // 月間統計の計算（メモ化）
  const { totalMonthTime, averageMonthTime, isPastMonth, isFutureMonth } = useMemo(() => {
    const currentMonthSessions = getCurrentMonthSessions(currentDate, sessions)
    const total = currentMonthSessions.reduce((sum, session) => sum + session.duration, 0)
    const average = currentMonthSessions.length > 0 ? Math.floor(total / currentMonthSessions.length) : 0
    
    const displayYear = currentDate.getFullYear()
    const displayMonth = currentDate.getMonth()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth()
    
    return {
      totalMonthTime: total,
      averageMonthTime: average,
      isPastMonth: displayYear < todayYear || (displayYear === todayYear && displayMonth < todayMonth),
      isFutureMonth: displayYear > todayYear || (displayYear === todayYear && displayMonth > todayMonth)
    }
  }, [currentDate, sessions, today])
  
  // 「まだ記録がありません」の文言を決定
  const getNoRecordsMessage = () => {
    if (isPastMonth) return t('common.no_records_past')
    if (isFutureMonth) return t('common.no_records_future')
    return t('common.no_records')
  }
  
  // 日付クリック時の処理
  const handleDateClick = (date: number, sessions: CalendarSession[]) => {
    if (sessions.length < 3) return
    
    const slashFormatDate = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${date}`
    const dateStr = formatDateForLocale(slashFormatDate, locale)
    
    setModalDate(dateStr)
    setModalSessions(sessions)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="bg-gray-950 text-white">
        <div className="px-0">
          <CalendarViewToggle viewMode="month" />
          
          <Card className="!bg-gray-950 border-0 rounded-none shadow-none">
            <CalendarHeader
              title={monthName}
              onNavigate={onNavigate}
              onTodayClick={onTodayClick}
              todayLabel="today"
            />

            <CardContent className="p-0">
              {/* 曜日ヘッダー */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {[
                  t('weekly_progress.days.monday'),
                  t('weekly_progress.days.tuesday'),
                  t('weekly_progress.days.wednesday'),
                  t('weekly_progress.days.thursday'),
                  t('weekly_progress.days.friday'),
                  t('weekly_progress.days.saturday'),
                  t('weekly_progress.days.sunday')
                ].map((day, index) => (
                  <div key={index} className="py-2 px-0 text-center text-gray-400 font-medium text-sm">
                    {day}
                  </div>
                ))}
              </div>

              {/* カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const todayCheck = isToday(day, currentDate)
                  
                  // プラン制限チェック
                  const canView = day ? canViewDate(day, currentDate, userPlan) : false
                  const daySessions = canView ? getSessionsForDate(day, currentDate, sessions) : []
                  const hasMoreSessions = daySessions.length > 2

                  // スケルトン表示（Freeプランで表示できない過去の日付）
                  if (day && !canView) {
                    return (
                      <div
                        key={index}
                        className="h-[70px] md:h-[120px] p-0 md:p-2 rounded-xl transition-colors border border-gray-800/30 bg-gray-900/30 opacity-40 cursor-not-allowed relative overflow-hidden"
                      >
                        <div className="mb-1 md:mb-2 flex justify-center md:justify-start">
                          <span className="text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full text-gray-600">
                            {day}
                          </span>
                        </div>
                        <div className="space-y-1 px-1">
                          <div className="h-6 md:h-8 bg-gray-700/50 rounded-md animate-pulse"></div>
                          <div className="h-6 md:h-8 bg-gray-700/50 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={index}
                      onClick={day && hasMoreSessions && canView ? () => handleDateClick(day, daySessions) : undefined}
                      className={`h-[70px] md:h-[120px] p-0 md:p-2 rounded-xl transition-colors ${
                        day ? `bg-gray-900 border border-gray-800/50` : "bg-gray-950/50"
                      } ${hasMoreSessions && canView ? "hover:bg-gray-800/80 cursor-pointer" : ""} ${todayCheck ? "relative overflow-hidden" : ""}`}
                    >
                      {todayCheck && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-700/0 via-emerald-700/50 to-emerald-700/0 opacity-50" />
                      )}
                      {day && (
                        <>
                          <div className="mb-1 md:mb-2 flex justify-center md:justify-start">
                            <span className={`text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
                              todayCheck 
                                ? "bg-emerald-700 text-white font-bold shadow-[0_0_10px_rgba(4,120,87,0.4)]" 
                                : "text-gray-400"
                            }`}>
                              {day}
                            </span>
                          </div>

                          {canView && (
                            <div className="space-y-1 px-1">
                              {daySessions.slice(0, 2).map((session) => (
                                <div
                                  key={session.id}
                                  className={`text-xs p-1 rounded-md shadow-sm backdrop-blur-sm ${session.color} bg-opacity-20 border-l-2 border-white/20`}
                                >
                                  <div className="flex items-center space-x-1">
                                    <span className="text-white truncate text-[10px] md:text-xs font-medium pl-1">
                                      {session.activity}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {daySessions.length > 2 && (
                                <div className={`text-[10px] md:text-xs text-gray-400 text-center py-0.5 rounded bg-gray-800/50`}>
                                  +{daySessions.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 統計サマリー */}
          <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-6 mb-2 md:mb-0">
            <CalendarStatsCard
              value={totalMonthTime}
              label={t('calendar.month_stats.total_time')}
              color="emerald"
              noRecordsMessage={getNoRecordsMessage()}
            />
            <CalendarStatsCard
              value={averageMonthTime}
              label={t('calendar.month_stats.average_time')}
              color="brown"
              noRecordsMessage={getNoRecordsMessage()}
            />
          </div>
        </div>
      </div>
      
      {/* モーダル */}
      <DateSessionsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={modalDate}
        sessions={modalSessions}
        completedSessions={completedSessions}
      />
      <PlanLimitModal
        isOpen={showPlanLimitModal}
        onClose={() => setShowPlanLimitModal(false)}
      />
    </>
  )
}

