"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatDuration } from "@/lib/format-duration"
import type { CompletedSession } from "./time-tracker"

interface CalendarSession {
  id: string
  date: string
  activity: string
  duration: number
  color: string
  icon: string
}

interface CalendarViewProps {
  viewMode?: "month" | "week"
  onViewModeChange?: (mode: "month" | "week") => void
  completedSessions: CompletedSession[]
}

export function CalendarView({ viewMode = "month", onViewModeChange, completedSessions }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [internalViewMode, setInternalViewMode] = useState(viewMode)
  const [selectedDateSessions, setSelectedDateSessions] = useState<CalendarSession[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setInternalViewMode(viewMode)
  }, [viewMode])

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // CompletedSessionをCalendarSessionに変換する関数
  const convertToCalendarSessions = (sessions: CompletedSession[]): CalendarSession[] => {
    return sessions.map((session) => {
      // セッションデータの安全性チェック
      if (!session || !session.endTime) {
        return {
          id: session?.id || Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          activity: "不明なアクティビティ",
          duration: 0,
          color: "bg-gray-500",
          icon: "📝"
        }
      }

      // セッションに保存された色・アイコン情報を優先し、なければ名前から推測
      const getActivityStyle = (session: CompletedSession) => {
        // セッションに色・アイコンが保存されている場合はそれを使用
        if (session.activityColor && session.activityIcon) {
          return { icon: session.activityIcon, color: session.activityColor }
        }

        // 色だけが保存されている場合
        if (session.activityColor) {
          return { icon: session.activityIcon || "", color: session.activityColor }
        }

        // 保存されていない場合は名前から推測（従来の方法）
        const activity = session.activityName
        if (!activity) {
          return { icon: "📝", color: "bg-gray-500" }
        }
        
        const activityLower = activity.toLowerCase()
        if (activityLower.includes('読書') || activityLower.includes('本')) {
          return { icon: "📚", color: "bg-blue-500" }
        } else if (activityLower.includes('プログラミング') || activityLower.includes('コード') || activityLower.includes('開発')) {
          return { icon: "💻", color: "bg-purple-500" }
        } else if (activityLower.includes('運動') || activityLower.includes('筋トレ') || activityLower.includes('ジム')) {
          return { icon: "🏃", color: "bg-red-500" }
        } else if (activityLower.includes('音楽') || activityLower.includes('楽器')) {
          return { icon: "🎵", color: "bg-yellow-500" }
        } else if (activityLower.includes('勉強') || activityLower.includes('学習')) {
          return { icon: "📖", color: "bg-green-500" }
        } else if (activityLower.includes('英語') || activityLower.includes('語学')) {
          return { icon: "🌍", color: "bg-teal-500" }
        } else if (activityLower.includes('絵') || activityLower.includes('デザイン') || activityLower.includes('アート')) {
          return { icon: "🎨", color: "bg-pink-500" }
        } else {
          return { icon: "📝", color: "bg-gray-500" }
        }
      }

      const style = getActivityStyle(session)
      // セッションの開始時刻を基準に日付を決定（日付跨ぎ対応）
      const sessionDate = new Date(session.startTime)
      const dateStr = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}-${String(sessionDate.getDate()).padStart(2, "0")}`

      return {
        id: session.id || Date.now().toString(),
        date: dateStr,
        activity: session.activityName || "不明なアクティビティ",
        duration: session.duration || 0, // 秒単位のまま保持
        color: style.color,
        icon: style.icon
      }
    })
  }

  // 実際のセッションデータを変換
  const sessions: CalendarSession[] = convertToCalendarSessions(completedSessions)

  const handleViewModeChange = (mode: "month" | "week") => {
    setInternalViewMode(mode)
    onViewModeChange?.(mode)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // 月曜日を週の開始にするため、日曜日を6、月曜日を0にする
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7

    const days = []

    // 前月の日付を埋める
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // 今月の日付
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    // 月曜日を週の開始とする（月曜日=1なので、1を引く）
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  const getSessionsForDate = (date: Date | number | null) => {
    if (!date) return []

    let dateStr: string
    if (date instanceof Date) {
      dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    } else {
      dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
    }

    const dateSessions = sessions.filter((session) => session.date === dateStr)
    
    // 同じアクティビティをまとめる
    const groupedSessions = new Map<string, CalendarSession>()
    dateSessions.forEach(session => {
      const key = session.activity
      if (groupedSessions.has(key)) {
        const existing = groupedSessions.get(key)!
        existing.duration += session.duration
      } else {
        groupedSessions.set(key, { ...session })
      }
    })
    
    return Array.from(groupedSessions.values())
  }

  const getTotalTimeForDate = (date: Date | number | null) => {
    const daySessions = getSessionsForDate(date)
    return daySessions.reduce((total, session) => total + session.duration, 0)
  }

  // 現在の期間（月または週）のセッションを取得
  const getCurrentPeriodSessions = () => {
    let periodSessions: CalendarSession[]
    
    if (internalViewMode === "month") {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      periodSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date)
        return sessionDate.getFullYear() === year && sessionDate.getMonth() === month
      })
    } else {
      const weekDays = getWeekDays(currentDate)
      const weekStart = weekDays[0]
      const weekEnd = weekDays[6]
      periodSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date)
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
    }
    
    // 同じアクティビティをまとめる（統計用）
    const groupedSessions = new Map<string, CalendarSession>()
    periodSessions.forEach(session => {
      const key = `${session.activity}-${session.date}`
      if (groupedSessions.has(key)) {
        const existing = groupedSessions.get(key)!
        existing.duration += session.duration
      } else {
        groupedSessions.set(key, { ...session })
      }
    })
    
    return Array.from(groupedSessions.values())
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 7)
      } else {
        newDate.setDate(prev.getDate() + 7)
      }
      return newDate
    })
  }

  const isToday = (date: Date | number | null) => {
    const today = new Date()
    if (date instanceof Date) {
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      )
    } else if (typeof date === "number") {
      return (
        date === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      )
    }
    return false
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    const monthName = currentDate.toLocaleDateString("ja-JP", { year: "numeric", month: "long" })

    return (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{monthName}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                今日
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
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
            {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
              <div key={day} className="p-2 text-center text-gray-400 font-medium text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const daySessions = getSessionsForDate(day)
              const totalTime = getTotalTimeForDate(day)
              const todayCheck = isToday(day)

              return (
                <div
                  key={index}
                  className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border border-gray-800 rounded-lg ${
                    day ? "bg-gray-800 hover:bg-gray-700 cursor-pointer" : "bg-gray-900"
                  } ${todayCheck ? "ring-2 ring-green-500" : ""}`}
                >
                  {day && (
                    <>
                      <div className="mb-1 md:mb-2">
                        <span className={`text-xs md:text-sm font-medium ${todayCheck ? "text-green-400" : "text-white"}`}>
                          {day}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {/* SP: 1つまで、PC: 2つまで表示 */}
                        {daySessions.slice(0, isMobile ? 1 : 2).map((session) => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded ${session.color} bg-opacity-20 border border-opacity-30`}
                          >
                            <div className="flex items-center space-x-1">
                              {session.icon ? (
                                <span className="text-xs">{session.icon}</span>
                              ) : (
                                <div className={`w-2 md:w-3 h-2 md:h-3 rounded-full ${session.color}`}></div>
                              )}
                              <span className="text-white truncate text-xs">{session.activity}</span>
                            </div>
                          </div>
                        ))}
                        {daySessions.length > (isMobile ? 1 : 2) && (
                          <div 
                            className="text-xs text-gray-400 text-center cursor-pointer hover:text-gray-200 py-1 rounded bg-gray-700 bg-opacity-50"
                            onClick={() => openSessionModal(day, daySessions)}
                          >
                            +{daySessions.length - (isMobile ? 1 : 2)}
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
      </>
    )
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)
    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]
    const weekRange = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`

    return (
      <>
        <CardHeader>
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("prev")}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                今週
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek("next")}
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
              const daySessions = getSessionsForDate(day)
              const totalTime = getTotalTimeForDate(day)
              const todayCheck = isToday(day)
              const dayNames = ["月", "火", "水", "木", "金", "土", "日"]

              return (
                <div
                  key={index}
                  className={`min-h-[280px] p-3 border border-gray-800 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer ${
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
                    {daySessions.slice(0, 2).map((session) => (
                      <div
                        key={session.id}
                        className={`text-xs p-2 rounded ${session.color} bg-opacity-20 border border-opacity-30`}
                      >
                        <div className="flex items-center space-x-1">
                          {session.icon ? (
                            <span>{session.icon}</span>
                          ) : (
                            <div className={`w-3 h-3 rounded-full ${session.color}`}></div>
                          )}
                          <span className="text-white truncate">{session.activity}</span>
                        </div>
                      </div>
                    ))}
                    {daySessions.length > 2 && (
                      <div 
                        className="text-xs text-gray-400 text-center cursor-pointer hover:text-gray-200 py-1 rounded bg-gray-700 bg-opacity-50"
                        onClick={() => openSessionModal(day, daySessions)}
                      >
                        その他+{daySessions.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </>
    )
  }

  // セッション詳細モーダルを開く
  const openSessionModal = (date: Date | number, sessions: CalendarSession[]) => {
    setSelectedDateSessions(sessions)
    
    let dateStr: string
    if (date instanceof Date) {
      dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
    } else {
      dateStr = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${date}`
    }
    setModalDate(dateStr)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      <div className="px-0">
        {/* 月/週切り替えボタン */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handleViewModeChange("month")}
              variant={internalViewMode === "month" ? "default" : "outline"}
              size="sm"
              className={
                internalViewMode === "month"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              月表示
            </Button>
            <Button
              onClick={() => handleViewModeChange("week")}
              variant={internalViewMode === "week" ? "default" : "outline"}
              size="sm"
              className={
                internalViewMode === "week"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              週表示
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800 border-l-0 border-r-0 rounded-none">
          {internalViewMode === "month" ? renderMonthView() : renderWeekView()}
        </Card>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-green-400">
                {(() => {
                  const periodSessions = getCurrentPeriodSessions()
                  const totalTime = periodSessions.reduce((total, session) => total + session.duration, 0)
                  return formatDuration(totalTime)
                })()}
              </div>
              <div className="text-xs md:text-sm text-gray-400">
                {internalViewMode === "month" ? "今月の総時間" : "今週の総時間"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-2 md:p-4 text-center">
              <div className="text-lg md:text-2xl font-bold text-purple-400">
                {(() => {
                  const periodSessions = getCurrentPeriodSessions()
                  if (periodSessions.length === 0) return "0"
                  const totalTime = periodSessions.reduce((total, session) => total + session.duration, 0)
                  const averageTime = Math.floor(totalTime / periodSessions.length)
                  return formatDuration(averageTime)
                })()}
              </div>
              <div className="text-xs md:text-sm text-gray-400">今週の平均時間</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* セッション詳細モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">{modalDate}の行動</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
            {selectedDateSessions.map((session) => (
              <div 
                key={session.id} 
                className={`p-3 rounded-lg ${session.color} bg-opacity-20 border border-opacity-30`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{session.icon}</span>
                  <span className="text-white font-medium">{session.activity}</span>
                </div>
              </div>
            ))}
            {selectedDateSessions.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                この日はアクティビティがありません
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
