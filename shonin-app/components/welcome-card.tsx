import { Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { CompletedSession } from "./time-tracker"

interface WelcomeCardProps {
  completedSessions: CompletedSession[]
}

export function WelcomeCard({ completedSessions }: WelcomeCardProps) {
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

  // 連続記録日数（仮データ）
  const streakDays = 7

  // 先週比（仮データ）
  const weeklyGrowth = "+15%"

  // 現在時刻
  const currentTime = new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <Card className="bg-green-500 border-0 text-white">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">おかえりなさい</h2>
          <p className="text-green-100 opacity-90">今日も努力を積み重ねましょう - {currentTime}</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">
              {totalSeconds > 0 ? formatTime(totalHours, totalMinutes) : "0m"}
            </div>
            <div className="text-sm text-green-100">今日の記録</div>
          </div>

          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{streakDays}</div>
            <div className="text-sm text-green-100">連続記録日</div>
          </div>

          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{weeklyGrowth}</div>
            <div className="text-sm text-green-100">先週比</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
