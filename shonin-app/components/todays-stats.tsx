import { Clock, CheckCircle, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CompletedSession } from "./time-tracker"

interface TodaysStatsProps {
  completedSessions: CompletedSession[]
}

export function TodaysStats({ completedSessions }: TodaysStatsProps) {
  // 今日のセッションを取得
  const today = new Date()
  const todaysSessions = completedSessions.filter(session => {
    const sessionDate = new Date(session.endTime)
    return sessionDate.toDateString() === today.toDateString()
  })

  // 今日の合計時間を計算（秒を時間に変換）
  const totalSeconds = todaysSessions.reduce((sum, session) => sum + session.duration, 0)
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

  // 時間表示のフォーマット
  const formatTime = (hours: number, minutes: number) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // 目標に対する進捗率（仮に8時間を目標とする）
  const targetHours = 8
  const progressPercentage = Math.min((totalSeconds / (targetHours * 3600)) * 100, 100)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          今日の統計
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">取り組んだ時間</span>
            <span className="text-green-400 font-mono">
              {totalSeconds > 0 ? formatTime(totalHours, totalMinutes) : "0m"}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
