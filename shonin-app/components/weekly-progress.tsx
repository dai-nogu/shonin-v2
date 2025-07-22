"use client"

import { BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDuration } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { getWeekStartInTimezone, getCurrentTimeInTimezone, getDateStringInTimezone } from "@/lib/timezone-utils"
import type { CompletedSession } from "./time-tracker"

interface WeeklyProgressProps {
  completedSessions: CompletedSession[]
  onWeekViewClick?: () => void
}

export function WeeklyProgress({ completedSessions, onWeekViewClick }: WeeklyProgressProps) {
  // タイムゾーンを取得
  const { timezone } = useTimezone()
  
  // 今週の開始日（月曜日）を取得（タイムゾーン考慮）
  const today = getCurrentTimeInTimezone(timezone)
  const weekStart = getWeekStartInTimezone(today, timezone)
  
  // 今週の各日のデータを計算
  const weekData = []
  const dayNames = ["月", "火", "水", "木", "金", "土", "日"]

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateString = getDateStringInTimezone(date, timezone)
    
    // その日のセッションを取得（タイムゾーン考慮）
    const daySessions = completedSessions.filter(session => {
      const sessionDateString = getDateStringInTimezone(session.startTime, timezone)
      return sessionDateString === dateString
    })

    // その日の合計時間を計算（秒単位で保持）
    const totalSeconds = daySessions.reduce((sum, session) => sum + session.duration, 0)

    // 進捗率を計算（1日4時間=14400秒を目標とする）
    const targetSeconds = 4 * 3600 // 4時間を秒に変換
    const progress = Math.min((totalSeconds / targetSeconds) * 100, 100)

    weekData.push({
      day: dayNames[i],
      totalSeconds: totalSeconds,
      progress: progress
    })
  }

  const totalWeekSeconds = weekData.reduce((sum, day) => sum + day.totalSeconds, 0)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
            今週の進捗
          </CardTitle>
          <Button
            onClick={onWeekViewClick}
            variant="ghost"
            size="sm"
            className="text-green-400 hover:text-green-300 hover:bg-gray-800 text-xs lg:text-sm"
          >
            <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
            週表示
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 lg:space-y-3">
        {weekData.map((day) => (
          <div key={day.day} className="flex items-center space-x-2 lg:space-x-3">
            <span className="text-gray-300 w-3 lg:w-4 text-xs lg:text-sm">{day.day}</span>
            <Progress value={day.progress} className="flex-1 h-1.5 lg:h-2" />
            <span className="text-gray-400 text-xs lg:text-sm w-10 lg:w-12 text-right">
              {formatDuration(day.totalSeconds)}
            </span>
          </div>
        ))}

        <div className="pt-3 lg:pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-xl lg:text-2xl font-bold text-green-400">
              {formatDuration(totalWeekSeconds)}
            </div>
            <div className="text-xs lg:text-sm text-gray-400">今週の合計</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
