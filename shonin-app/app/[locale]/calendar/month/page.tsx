// カレンダー月の固有ロジック

"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { MonthCalendarCSR } from "@/components/ui/calendar/month/month-calendar-csr"
import { useSessionList } from "@/hooks/useSessionList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"
import { formatDuration } from "@/lib/format-duration"
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

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        <Card className="bg-gray-900 border-0 rounded-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{monthName}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("prev")}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTodayClick}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  {t('calendar.today')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate("next")}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

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

                return (
                  <div
                    key={index}
                    onClick={day ? () => onDateClick(day, daySessions) : undefined}
                    className={`h-[70px] md:h-[120px] p-0 md:p-2 rounded-lg transition-all duration-200 ${
                      day ? `bg-gray-800 cursor-pointer hover:ring-2 hover:ring-green-500/50` : "bg-gray-900"
                    } ${todayCheck ? "ring-2 ring-green-500" : ""}`}
                  >
                    {day && (
                      <>
                        <div className="mb-1 md:mb-2 text-center">
                          <span className={`text-xs md:text-sm font-medium ${todayCheck ? "text-green-400" : "text-white"}`}>
                            {day}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {/* SP: 1つまで、PC: 2つまで表示 */}
                          {daySessions.slice(0, 2).map((session) => (
                            <div
                              key={session.id}
                              className={`text-xs p-[0.1rem] md:p-1 rounded ${session.color} bg-opacity-20 border-opacity-30`}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="text-white truncate text-xs">{session.activity}</span>
                              </div>
                            </div>
                          ))}
                          {daySessions.length > 2 && (
                            <div className={`text-xs text-gray-400 text-center py-[0.1rem] md:py-1 rounded bg-gray-700 bg-opacity-50`}>
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
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              {totalMonthTime === 0 ? (
                <>
                  <div className="flex justify-center mb-1 md:mb-2">
                    <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">まだ軌跡がありません</div>
                </>
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold text-green-400">
                    {formatDuration(totalMonthTime)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">
                    {t('calendar.month_stats.total_time')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              {averageMonthTime === 0 ? (
                <>
                  <div className="flex justify-center mb-1 md:mb-2">
                    <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">まだ軌跡がありません</div>
                </>
              ) : (
                <>
                  <div className="text-lg md:text-2xl font-bold text-purple-400">
                    {formatDuration(averageMonthTime)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400">
                    {t('calendar.month_stats.average_time')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
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