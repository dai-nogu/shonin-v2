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
import { getWeekStart } from "@/lib/date-utils"
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { 
  convertToCalendarSessions, 
  getSessionsForWeekDate, 
  isTodayWeek, 
  getCurrentWeekSessions,
  calculateWeekAverageTime,
  canViewDate,
  type CalendarSession 
} from "@/lib/calendar-utils"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface WeekCalendarViewProps {
  currentDate: Date
  completedSessions: CompletedSession[]
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  showPlanLimitModal: boolean
  setShowPlanLimitModal: (show: boolean) => void
}

export function WeekCalendarView({
  currentDate,
  completedSessions,
  onNavigate,
  onTodayClick,
  showPlanLimitModal,
  setShowPlanLimitModal
}: WeekCalendarViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const { userPlan } = useSubscriptionContext()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [modalSessions, setModalSessions] = useState<CalendarSession[]>([])
  
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // セッションデータの変換（メモ化）
  const sessions = useMemo(() => convertToCalendarSessions(completedSessions), [completedSessions])
  
  // タイムゾーンを考慮した週の範囲を計算（メモ化）
  const { weekStart, weekEnd, weekDays, isPastWeek, isFutureWeek } = useMemo(() => {
    const start = getWeekStart(currentDate)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    
    return {
      weekStart: start,
      weekEnd: end,
      weekDays: days,
      isPastWeek: end < todayStart,
      isFutureWeek: start > todayStart
    }
  }, [currentDate, today])
  
  // 週間統計の計算（メモ化）
  const { totalWeekTime, averageWeekTime } = useMemo(() => {
    const currentWeekSessions = getCurrentWeekSessions(currentDate, sessions)
    const total = currentWeekSessions.reduce((sum, session) => sum + session.duration, 0)
    const average = calculateWeekAverageTime(currentDate, sessions)
    
    return {
      totalWeekTime: total,
      averageWeekTime: average
    }
  }, [currentDate, sessions])
  
  // 「まだ記録がありません」の文言を決定
  const getNoRecordsMessage = () => {
    if (isPastWeek) return t('common.no_records_past')
    if (isFutureWeek) return t('common.no_records_future')
    return t('common.no_records')
  }
  
  // 日付クリック時の処理
  const handleDateClick = (date: Date, sessions: CalendarSession[]) => {
    if (sessions.length < 3) return
    
    const slashFormatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    const dateStr = formatDateForLocale(slashFormatDate, locale)
    
    setModalDate(dateStr)
    setModalSessions(sessions)
    setIsModalOpen(true)
  }

  return (
    <>
      <div className="bg-gray-950 text-white">
        <div className="px-0">
          {/* 月/週切り替えボタン */}
          <CalendarViewToggle viewMode="week" />
          
          <Card className="!bg-gray-950 border-0 rounded-none shadow-none">
            <CalendarHeader
              onNavigate={onNavigate}
              onTodayClick={onTodayClick}
              todayLabel="this_week"
            />

            <CardContent className="p-0">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, index) => {
                  const todayCheck = isTodayWeek(day)
                  const dayNames = [
                    t('weekly_progress.days.monday'),
                    t('weekly_progress.days.tuesday'),
                    t('weekly_progress.days.wednesday'),
                    t('weekly_progress.days.thursday'),
                    t('weekly_progress.days.friday'),
                    t('weekly_progress.days.saturday'),
                    t('weekly_progress.days.sunday')
                  ]
                  
                  // プラン制限チェック
                  const canView = canViewDate(day, currentDate, userPlan)
                  const daySessions = canView ? getSessionsForWeekDate(day, sessions) : []
                  
                  // スケルトン表示の場合（Freeプランで表示できない過去の日付）
                  if (!canView) {
                    return (
                      <div
                        key={index}
                        className="min-h-[150px] p-0 md:p-3 rounded-xl transition-colors border border-gray-800/30 bg-gray-900/30 opacity-40 cursor-not-allowed relative overflow-hidden"
                      >
                        <div className="text-center mb-3 flex flex-col items-center">
                          <div className="text-gray-600 text-sm mb-1">{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                          <div className="w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium text-gray-600">
                            {day.getDate()}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-8 bg-gray-700/50 rounded-md animate-pulse"></div>
                          <div className="h-8 bg-gray-700/50 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    )
                  }

                  const hasMoreSessions = daySessions.length > 2

                  return (
                    <div
                      key={index}
                      onClick={hasMoreSessions ? () => handleDateClick(day, daySessions) : undefined}
                      className={`min-h-[150px] p-0 md:p-3 rounded-xl transition-colors border border-gray-800/50 ${
                        todayCheck ? "bg-gray-900/80 relative overflow-hidden" : "bg-gray-900"
                      } ${hasMoreSessions ? "hover:bg-gray-800/80 cursor-pointer" : ""}`}
                    >
                      {todayCheck && (
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-700/0 via-emerald-700/50 to-emerald-700/0 opacity-50" />
                      )}
                      <div className="text-center mb-3 flex flex-col items-center">
                        <div className="text-gray-400 text-sm mb-1">{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-medium ${
                          todayCheck 
                            ? "bg-emerald-700 text-white shadow-[0_0_10px_rgba(4,120,87,0.4)]" 
                            : "text-white"
                        }`}>
                          {day.getDate()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {daySessions.slice(0, 2).map((session: CalendarSession) => (
                          <div
                            key={session.id}
                            className={`text-xs p-[0.1rem] md:p-2 rounded-md shadow-sm backdrop-blur-sm ${session.color} bg-opacity-20 border-l-2 border-white/20`}
                          >
                            <div className="flex items-center space-x-1">
                              <span className="text-white truncate pl-1 font-medium">{session.activity}</span>
                            </div>
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className={`text-xs text-gray-400 text-center py-[0.1rem] md:py-1 rounded bg-gray-800/50`}>
                            {t('calendar.others_count', { count: daySessions.length - 2 })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* 統計サマリー */}
          <div className="grid grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-6 mb-2 md:mb-0">
            <CalendarStatsCard
              value={totalWeekTime}
              label={t('calendar.week_stats.total_time')}
              color="emerald"
              noRecordsMessage={getNoRecordsMessage()}
            />
            <CalendarStatsCard
              value={averageWeekTime}
              label={t('calendar.week_stats.average_time')}
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

