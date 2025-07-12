import { Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatTime } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { getTodaySessionsInTimezone, calculateStreakDays, getWeekSessionsInTimezone } from "@/lib/timezone-utils"
import type { CompletedSession } from "./time-tracker"

interface WelcomeCardProps {
  completedSessions: CompletedSession[]
}

export function WelcomeCard({ completedSessions }: WelcomeCardProps) {
  // タイムゾーンを取得
  const { timezone } = useTimezone()
  
  // 今日のセッションを取得（タイムゾーン考慮）
  const todaysSessions = getTodaySessionsInTimezone(completedSessions, timezone)

  // 今日の合計時間を計算（秒を時間に変換）
  const totalSeconds = todaysSessions.reduce((sum, session) => sum + session.duration, 0)
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

  // 連続記録日数を計算（タイムゾーン考慮）
  const streakDays = calculateStreakDays(completedSessions, timezone)

  // 先週比の計算（タイムゾーン考慮）
  const calculateWeeklyGrowth = () => {
    // 今週のセッションを取得
    const thisWeekSessions = getWeekSessionsInTimezone(completedSessions, timezone)
    
    // 先週のセッションを取得（簡易版）
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const lastWeekSessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.startTime)
      const oneWeekAgoDate = new Date(oneWeekAgo)
      const twoWeeksAgo = new Date(oneWeekAgo)
      twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7)
      return sessionDate >= twoWeeksAgo && sessionDate < oneWeekAgoDate
    })

    // 合計時間を計算（秒単位）
    const thisWeekTotal = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0)
    const lastWeekTotal = lastWeekSessions.reduce((sum, session) => sum + session.duration, 0)

    // 増減率を計算
    if (lastWeekTotal === 0) {
      return thisWeekTotal > 0 ? "+100%" : "±0%"
    }

    const growthRate = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
    const roundedRate = Math.round(growthRate)

    if (roundedRate > 0) {
      return `+${roundedRate}%`
    } else if (roundedRate < 0) {
      return `${roundedRate}%`
    } else {
      return "±0%"
    }
  }

  const weeklyGrowth = calculateWeeklyGrowth()

  // 現在時刻（タイムゾーン考慮）
  const currentTime = new Date().toLocaleTimeString('ja-JP', { 
    timeZone: timezone,
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
          <div className="text-center flex flex-col items-center justify-between h-20">
            <Clock className="w-6 h-6" />
            <div className={`font-bold ${totalSeconds > 0 ? 'text-2xl' : 'text-base'} leading-tight`}>
              {formatTime(totalHours, totalMinutes)}
            </div>
            <div className="text-sm text-green-100">今日の記録</div>
          </div>

          <div className="text-center flex flex-col items-center justify-between h-20">
            <Target className="w-6 h-6" />
            <div className="text-2xl font-bold leading-tight">{streakDays}</div>
            <div className="text-sm text-green-100">連続記録日</div>
          </div>

          <div className="text-center flex flex-col items-center justify-between h-20">
            <TrendingUp className="w-6 h-6" />
            <div className="text-2xl font-bold leading-tight">{weeklyGrowth}</div>
            <div className="text-sm text-green-100">先週比</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
