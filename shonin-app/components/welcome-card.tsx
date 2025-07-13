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

  // 前日比の計算（タイムゾーン考慮）
  const calculateDailyGrowth = () => {
    // 今日のセッションを取得
    const todaysSessions = getTodaySessionsInTimezone(completedSessions, timezone)
    
    // 昨日のセッションを取得
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDateString = yesterday.toLocaleDateString('ja-JP', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-')
    
    const yesterdaySessions = completedSessions.filter(session => {
      const sessionDateString = new Date(session.startTime).toLocaleDateString('ja-JP', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-')
      return sessionDateString === yesterdayDateString
    })

    // 合計時間を計算（秒単位）
    const todayTotal = todaysSessions.reduce((sum, session) => sum + session.duration, 0)
    const yesterdayTotal = yesterdaySessions.reduce((sum, session) => sum + session.duration, 0)

    // 両方とも0の場合
    if (todayTotal === 0 && yesterdayTotal === 0) {
      return "±0%"
    }

    // 今日が0で昨日にデータがあった場合
    if (todayTotal === 0 && yesterdayTotal > 0) {
      return "-100%"
    }

    // 昨日が0の場合の汎用的な計算
    // 1時間（3600秒）を基準値として使用
    if (yesterdayTotal === 0) {
      const baseValue = 3600 // 1時間を基準値とする
      const growthRate = (todayTotal / baseValue) * 100
      const roundedRate = Math.round(growthRate)
      return `+${roundedRate}%`
    }

    // 通常の増減率計算
    const growthRate = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
    const roundedRate = Math.round(growthRate)

    if (roundedRate > 0) {
      return `+${roundedRate}%`
    } else if (roundedRate < 0) {
      return `${roundedRate}%`
    } else {
      return "±0%"
    }
  }

  const dailyGrowth = calculateDailyGrowth()

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

        <div className="grid grid-cols-3 gap-3 lg:gap-6">
          <div className="text-center flex flex-col items-center justify-center h-16 lg:h-20 gap-1 lg:gap-2">
            <div className={`font-bold ${totalSeconds > 0 ? 'text-lg lg:text-2xl' : 'text-sm lg:text-base'} leading-tight`}>
              {formatTime(totalHours, totalMinutes)}
            </div>
            <div className="text-xs lg:text-sm text-green-100">今日の記録</div>
          </div>

          <div className="text-center flex flex-col items-center justify-center h-16 lg:h-20 gap-1 lg:gap-2">
            <div className="text-lg lg:text-2xl font-bold leading-tight">{streakDays}</div>
            <div className="text-xs lg:text-sm text-green-100">連続記録日</div>
          </div>

          <div className="text-center flex flex-col items-center justify-center h-16 lg:h-20 gap-1 lg:gap-2">
            <div className="text-lg lg:text-2xl font-bold leading-tight">{dailyGrowth}</div>
            <div className="text-xs lg:text-sm text-green-100">前日比</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
