import { Card, CardContent } from "@/components/ui/card"
import { formatTime } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { getTodaySessionsInTimezone, getWeekSessionsInTimezone } from "@/lib/timezone-utils"
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





  // 現在時刻（タイムゾーン考慮）
  const currentTime = new Date().toLocaleTimeString('ja-JP', { 
    timeZone: timezone,
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <Card className="bg-green-500 border-0 text-white">
      <CardContent className="p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="text-xl lg:text-2xl font-bold mb-1">おかえりなさい</h2>
          <p className="text-green-100 opacity-90 text-sm lg:text-base">今日も努力を積み重ねましょう - {currentTime}</p>
        </div>

        <div className="text-center">
          <div className="font-bold leading-tight" style={{ fontSize: '1.5rem' }}>
            {formatTime(totalHours, totalMinutes)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
