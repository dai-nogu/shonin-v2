// カレンダー週の固有ロジック

"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { WeekCalendarCSR } from "@/components/ui/calendar/week/week-calendar-csr"
import { useSessionList } from "@/hooks/useSessionList"
import { Card, CardContent, CardHeader } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { ChevronLeft, ChevronRight, BarChart3 } from "lucide-react"
import { formatDuration } from "@/lib/format-duration"
import { getWeekStart } from "@/lib/date-utils"
import { useTranslations } from 'next-intl'
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import { 
  convertToCalendarSessions, 
  getSessionsForWeekDate, 
  isTodayWeek, 
  getCurrentWeekSessions,
  calculateWeekAverageTime,
  type CalendarSession 
} from "@/lib/calendar-utils"

interface WeekCalendarSSRProps {
  currentDate: Date
  completedSessions: CompletedSession[]
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick: (date: Date, sessions: CalendarSession[]) => void
  userPlan?: 'free' | 'standard' | 'premium'
  subscriptionLoading?: boolean
}

// 共通ユーティリティを使用

function WeekCalendarSSR({ 
  currentDate, 
  completedSessions, 
  onNavigate, 
  onTodayClick,
  onDateClick,
  userPlan = 'free',
  subscriptionLoading = false
}: WeekCalendarSSRProps) {
  const t = useTranslations()
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  // セッションデータの変換（SSR側で実行）
  const sessions = convertToCalendarSessions(completedSessions)
  
  // タイムゾーンを考慮した週の範囲を計算
  const weekStart = getWeekStart(currentDate)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  // 今日の日付（時間をリセット）
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  // 週が過去/未来/今週かを判定
  const isPastWeek = weekEnd < todayStart
  const isFutureWeek = weekStart > todayStart
  
  // 「まだ記録がありません」の文言を決定
  const getNoRecordsMessage = () => {
    if (isPastWeek) return t('common.no_records_past')
    if (isFutureWeek) return t('common.no_records_future')
    return t('common.no_records')
  }
  
  // 週の各日を生成
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    weekDays.push(day)
  }
  
  // 週間統計の計算
  const currentWeekSessions = getCurrentWeekSessions(currentDate, sessions)
  const totalWeekTime = currentWeekSessions.reduce((total, session) => total + session.duration, 0)
  
  // 週の平均時間計算
  const averageWeekTime = calculateWeekAverageTime(currentDate, sessions)

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        <Card className="!bg-gray-950 border-0 rounded-none shadow-none">
          <CardHeader>
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onTodayClick}
                  className="text-gray-300 hover:bg-white/10"
                >
                  {t('calendar.this_week')}
                </Button>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("prev")}
                    className="text-gray-300 hover:bg-white/10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("next")}
                    className="text-gray-300 hover:bg-white/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const daySessions = getSessionsForWeekDate(day, sessions)
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
                
                // 前月の日付かどうかをチェック
                const isPastMonth = userPlan === 'free' && 
                  (day.getFullYear() < currentYear || 
                   (day.getFullYear() === currentYear && day.getMonth() < currentMonth))
                
                // スケルトン表示の場合
                if (isPastMonth) {
                  return (
                    <div
                      key={index}
                      className="min-h-[150px] p-0 md:p-3 rounded-lg bg-gray-800 opacity-30 cursor-not-allowed"
                    >
                      <div className="text-center mb-3">
                        <div className="text-gray-500 text-sm">{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                        <div className="text-lg font-medium text-gray-600">
                          {day.getDate()}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
                        <div className="h-8 bg-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                  )
                }

                const hasMoreSessions = daySessions.length > 2

                return (
                  <div
                    key={index}
                    onClick={hasMoreSessions ? () => onDateClick(day, daySessions) : undefined}
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
          <Card className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-xl shadow-lg">
            <CardContent className="p-3 md:p-6 text-center">
              {totalWeekTime === 0 ? (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-full bg-gray-800/50">
                      <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">{getNoRecordsMessage()}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl md:text-3xl font-bold text-emerald-500 mb-1">
                    {formatDuration(totalWeekTime)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 font-medium tracking-wide">
                    {t('calendar.week_stats.total_time')}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-xl shadow-lg">
            <CardContent className="p-3 md:p-6 text-center">
              {averageWeekTime === 0 ? (
                <>
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-full bg-gray-800/50">
                      <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">{getNoRecordsMessage()}</div>
                </>
              ) : (
                <>
                  <div className="text-2xl md:text-3xl font-bold text-[#96514d] mb-1">
                    {formatDuration(averageWeekTime)}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 font-medium tracking-wide">
                    {t('calendar.week_stats.average_time')}
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

export default function CalendarWeekPage() {
  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-2 md:px-4 py-4 lg:py-8">
            <WeekCalendarCSR 
              CalendarComponent={WeekCalendarSSR}
            />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="calendar" />
    </>
  )
} 