// カレンダー月の固有ロジック

"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { MonthCalendarCSR } from "@/components/ui/calendar/month/month-calendar-csr"
import { useSessionList } from "@/hooks/useSessionList"
import { Card, CardContent } from "@/components/ui/common/card"
import { CalendarHeader } from "@/components/ui/calendar/calendar-header"
import { CalendarStatsCard } from "@/components/ui/calendar/calendar-stats-card"
import { useTranslations, useLocale } from 'next-intl'
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import { 
  convertToCalendarSessions, 
  getDaysInMonth, 
  getSessionsForDate, 
  isToday, 
  getCurrentMonthSessions,
  type CalendarSession 
} from "@/lib/calendar-utils"

interface MonthCalendarSSRProps {
  currentDate: Date
  completedSessions: CompletedSession[]
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick: (date: number, sessions: CalendarSession[]) => void
}

// 共通ユーティリティを使用

function MonthCalendarSSR({ 
  currentDate, 
  completedSessions, 
  onNavigate, 
  onTodayClick,
  onDateClick
}: MonthCalendarSSRProps) {
  const t = useTranslations()
  const locale = useLocale()
  const today = new Date()
  
  // セッションデータの変換（SSR側で実行）
  const sessions = convertToCalendarSessions(completedSessions)
  const days = getDaysInMonth(currentDate)
  
  // ロケールに応じた年月表示
  const monthName = locale === 'en' 
    ? currentDate.toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : currentDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })
  
  // 月間統計の計算
  const currentMonthSessions = getCurrentMonthSessions(currentDate, sessions)
  const totalMonthTime = currentMonthSessions.reduce((total, session) => total + session.duration, 0)
  const averageMonthTime = currentMonthSessions.length > 0 ? Math.floor(totalMonthTime / currentMonthSessions.length) : 0
  
  // 月が過去/未来/今月かを判定
  const displayYear = currentDate.getFullYear()
  const displayMonth = currentDate.getMonth()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  
  const isPastMonth = displayYear < todayYear || (displayYear === todayYear && displayMonth < todayMonth)
  const isFutureMonth = displayYear > todayYear || (displayYear === todayYear && displayMonth > todayMonth)
  
  // 「まだ記録がありません」の文言を決定
  const getNoRecordsMessage = () => {
    if (isPastMonth) return t('common.no_records_past')
    if (isFutureMonth) return t('common.no_records_future')
    return t('common.no_records')
  }

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
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
                const daySessions = getSessionsForDate(day, currentDate, sessions)
                const todayCheck = isToday(day, currentDate)

                const hasMoreSessions = daySessions.length > 2

                return (
                  <div
                    key={index}
                    onClick={day && hasMoreSessions ? () => onDateClick(day, daySessions) : undefined}
                    className={`h-[70px] md:h-[120px] p-0 md:p-2 rounded-xl transition-colors ${
                      day ? `bg-gray-900 border border-gray-800/50` : "bg-gray-950/50"
                    } ${hasMoreSessions ? "hover:bg-gray-800/80 cursor-pointer" : ""} ${todayCheck ? "relative overflow-hidden" : ""}`}
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

                        <div className="space-y-1 px-1">
                          {/* SP: 1つまで、PC: 2つまで表示 */}
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
  )
}

export default function CalendarMonthPage() {
  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-2 md:px-4 py-4 lg:py-8">
            <MonthCalendarCSR 
              CalendarComponent={MonthCalendarSSR}
            />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="calendar" />
    </>
  )
} 