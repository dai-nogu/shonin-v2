"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
}

export function CalendarView({ viewMode = "month", onViewModeChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [internalViewMode, setInternalViewMode] = useState(viewMode)

  useEffect(() => {
    setInternalViewMode(viewMode)
  }, [viewMode])

  // サンプルデータ
  const sessions: CalendarSession[] = [
    { id: "1", date: "2024-01-15", activity: "読書", duration: 90, color: "bg-blue-500", icon: "📚" },
    { id: "2", date: "2024-01-15", activity: "プログラミング", duration: 135, color: "bg-purple-500", icon: "💻" },
    { id: "3", date: "2024-01-16", activity: "運動", duration: 45, color: "bg-red-500", icon: "🏃" },
    { id: "4", date: "2024-01-17", activity: "読書", duration: 60, color: "bg-blue-500", icon: "📚" },
    { id: "5", date: "2024-01-18", activity: "音楽練習", duration: 75, color: "bg-yellow-500", icon: "🎵" },
  ]

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

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
    const startingDayOfWeek = firstDay.getDay()

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
    const diff = startOfWeek.getDate() - day // 日曜日を週の開始とする
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

    return sessions.filter((session) => session.date === dateStr)
  }

  const getTotalTimeForDate = (date: Date | number | null) => {
    const daySessions = getSessionsForDate(date)
    return daySessions.reduce((total, session) => total + session.duration, 0)
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

        <CardContent>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
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
                  className={`min-h-[120px] p-2 border border-gray-800 rounded-lg ${
                    day ? "bg-gray-800 hover:bg-gray-700 cursor-pointer" : "bg-gray-900"
                  } ${todayCheck ? "ring-2 ring-green-500" : ""}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${todayCheck ? "text-green-400" : "text-white"}`}>
                          {day}
                        </span>
                        {totalTime > 0 && (
                          <div className="flex items-center text-xs text-green-400">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(totalTime)}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        {daySessions.slice(0, 3).map((session) => (
                          <div
                            key={session.id}
                            className={`text-xs p-1 rounded ${session.color} bg-opacity-20 border border-opacity-30`}
                          >
                            <div className="flex items-center space-x-1">
                              <span>{session.icon}</span>
                              <span className="text-white truncate">{session.activity}</span>
                            </div>
                            <div className="text-gray-300 text-xs">{formatDuration(session.duration)}</div>
                          </div>
                        ))}
                        {daySessions.length > 3 && (
                          <div className="text-xs text-gray-400 text-center">+{daySessions.length - 3} more</div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">週表示 ({weekRange})</CardTitle>
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

        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const daySessions = getSessionsForDate(day)
              const totalTime = getTotalTimeForDate(day)
              const todayCheck = isToday(day)
              const dayNames = ["日", "月", "火", "水", "木", "金", "土"]

              return (
                <div
                  key={index}
                  className={`min-h-[200px] p-3 border border-gray-800 rounded-lg bg-gray-800 hover:bg-gray-700 cursor-pointer ${
                    todayCheck ? "ring-2 ring-green-500" : ""
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-gray-400 text-sm">{dayNames[index]}</div>
                    <div className={`text-lg font-medium ${todayCheck ? "text-green-400" : "text-white"}`}>
                      {day.getDate()}
                    </div>
                    {totalTime > 0 && (
                      <div className="flex items-center justify-center text-xs text-green-400 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(totalTime)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {daySessions.map((session) => (
                      <div
                        key={session.id}
                        className={`text-xs p-2 rounded ${session.color} bg-opacity-20 border border-opacity-30`}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <span>{session.icon}</span>
                          <span className="text-white truncate">{session.activity}</span>
                        </div>
                        <div className="text-gray-300 text-xs">{formatDuration(session.duration)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-6 h-6 text-green-400" />
            <h1 className="text-2xl font-bold">カレンダー</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={internalViewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("month")}
              className={
                internalViewMode === "month"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              月表示
            </Button>
            <Button
              variant={internalViewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewModeChange("week")}
              className={
                internalViewMode === "week"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              週表示
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 container mx-auto">
        <Card className="bg-gray-900 border-gray-800">
          {internalViewMode === "month" ? renderMonthView() : renderWeekView()}
        </Card>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatDuration(sessions.reduce((total, session) => total + session.duration, 0))}
              </div>
              <div className="text-sm text-gray-400">
                {internalViewMode === "month" ? "今月の総時間" : "今週の総時間"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{sessions.length}</div>
              <div className="text-sm text-gray-400">
                {internalViewMode === "month" ? "今月のセッション数" : "今週のセッション数"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">
                {sessions.length > 0
                  ? formatDuration(
                      Math.floor(sessions.reduce((total, session) => total + session.duration, 0) / sessions.length),
                    )
                  : "0m"}
              </div>
              <div className="text-sm text-gray-400">平均セッション時間</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
