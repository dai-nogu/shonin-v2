"use client"

import { BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatDuration } from "@/lib/format-duration"
import type { CompletedSession } from "./time-tracker"

interface WeeklyProgressProps {
  completedSessions: CompletedSession[]
  onWeekViewClick?: () => void
}

export function WeeklyProgress({ completedSessions, onWeekViewClick }: WeeklyProgressProps) {
  // 今週の開始日（月曜日）を取得
  const getWeekStart = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を週の開始とする
    return new Date(today.setDate(diff))
  }

  // 今週の各日のデータを計算
  const weekStart = getWeekStart()
  const weekData = []
  const dayNames = ["月", "火", "水", "木", "金", "土", "日"]

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    
    // その日のセッションを取得
    const daySessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.endTime)
      return sessionDate.toDateString() === date.toDateString()
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            今週の進捗
          </CardTitle>
          <Button
            onClick={onWeekViewClick}
            variant="ghost"
            size="sm"
            className="text-green-400 hover:text-green-300 hover:bg-gray-800"
          >
            <Calendar className="w-4 h-4 mr-1" />
            週表示
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {weekData.map((day) => (
          <div key={day.day} className="flex items-center space-x-3">
            <span className="text-gray-300 w-4">{day.day}</span>
            <Progress value={day.progress} className="flex-1 h-2" />
            <span className="text-gray-400 text-sm w-12 text-right">
              {formatDuration(day.totalSeconds)}
            </span>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatDuration(totalWeekSeconds)}
            </div>
            <div className="text-sm text-gray-400">今週の合計</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
