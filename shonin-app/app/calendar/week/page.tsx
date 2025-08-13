// カレンダー週の固有ロジック

"use client"

import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { WeekCalendarCSR } from "@/components/ui/calendar/week/week-calendar-csr"
import { useSessionList } from "@/hooks/useSessionList"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDuration } from "@/lib/format-duration"
import { getWeekStartInTimezone } from "@/lib/timezone-utils"
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
  timezone: string
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick: (date: Date, sessions: CalendarSession[]) => void
}

// 共通ユーティリティを使用

function WeekCalendarSSR({ 
  currentDate, 
  completedSessions, 
  timezone, 
  onNavigate, 
  onTodayClick, 
  onDateClick 
}: WeekCalendarSSRProps) {
  // セッションデータの変換（SSR側で実行）
  const sessions = convertToCalendarSessions(completedSessions, timezone)
  
  // タイムゾーンを考慮した週の範囲を計算
  const weekStart = getWeekStartInTimezone(currentDate, timezone)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  // 週の各日を生成
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    weekDays.push(day)
  }
  
  // 週間統計の計算
  const currentWeekSessions = getCurrentWeekSessions(currentDate, sessions, timezone)
  const totalWeekTime = currentWeekSessions.reduce((total, session) => total + session.duration, 0)
  
  // 週の平均時間計算
  const averageWeekTime = calculateWeekAverageTime(currentDate, sessions, timezone)

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        <Card className="bg-gray-900 border-0 rounded-none">
          <CardHeader>
            <div className="flex items-center justify-end">
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
                  今週
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
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const daySessions = getSessionsForWeekDate(day, sessions)
                const todayCheck = isTodayWeek(day)
                const dayNames = ["月", "火", "水", "木", "金", "土", "日"]

                return (
                  <div
                    key={index}
                    onClick={() => onDateClick(day, daySessions)}
                    className={`min-h-[150px] p-0 md:p-3 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer ${
                      todayCheck ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    <div className="text-center mb-3">
                      <div className="text-gray-400 text-sm">{dayNames[day.getDay() === 0 ? 6 : day.getDay() - 1]}</div>
                      <div className={`text-lg font-medium ${todayCheck ? "text-green-400" : "text-white"}`}>
                        {day.getDate()}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {daySessions.slice(0, 2).map((session: CalendarSession) => (
                        <div
                          key={session.id}
                          className={`text-xs p-[0.1rem] md:p-2 rounded ${session.color} bg-opacity-20 border-opacity-30`}
                        >
                          <div className="flex items-center space-x-1">
                            <div className="hidden md:block">
                              {session.icon ? (
                                <span>{session.icon}</span>
                              ) : (
                                <div className={`w-3 h-3 rounded-full ${session.color}`}></div>
                              )}
                            </div>
                            <span className="text-white truncate">{session.activity}</span>
                          </div>
                        </div>
                      ))}
                      {daySessions.length > 2 && (
                        <div className={`text-xs text-gray-400 text-center py-[0.1rem] md:py-1 rounded bg-gray-700 bg-opacity-50`}>
                          その他+{daySessions.length - 2}
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
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-green-400">
                {formatDuration(totalWeekTime)}
              </div>
              <div className="text-xs md:text-sm text-gray-400">
                今週の総時間
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-purple-400">
                {formatDuration(averageWeekTime)}
              </div>
              <div className="text-xs md:text-sm text-gray-400">
                今週の平均時間
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CalendarWeekPage() {
  // セッション一覧取得フック
  const { user, isInitialized, completedSessions } = useSessionList()

  return (
    <>
      <AppSidebar currentPage="calendar" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-2 md:px-4 py-4 lg:py-8">
            <WeekCalendarCSR 
              completedSessions={completedSessions}
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