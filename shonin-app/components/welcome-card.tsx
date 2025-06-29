import { Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { formatTime } from "@/lib/format-duration"
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

  // 連続記録日数を計算
  const calculateStreakDays = () => {
    if (completedSessions.length === 0) return 0

    // セッションを日付ごとにグループ化
    const sessionsByDate = new Map<string, boolean>()
    completedSessions.forEach(session => {
      const sessionDate = new Date(session.endTime)
      const dateKey = sessionDate.toDateString()
      sessionsByDate.set(dateKey, true)
    })

    // 今日から遡って連続日数を計算
    let streakCount = 0
    const today = new Date()
    
    for (let i = 0; i < 365; i++) { // 最大365日まで遡る
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateKey = checkDate.toDateString()
      
      if (sessionsByDate.has(dateKey)) {
        streakCount++
      } else {
        // 連続が途切れた場合
        break
      }
    }
    
    return streakCount
  }

  const streakDays = calculateStreakDays()

  // 先週比の計算
  const calculateWeeklyGrowth = () => {
    const now = new Date()
    
    // 今週の開始日（月曜日）
    const currentWeekStart = new Date(now)
    const currentDay = now.getDay() // 0=日曜日, 1=月曜日...
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1 // 日曜日の場合は6日前が月曜日
    currentWeekStart.setDate(now.getDate() - daysFromMonday)
    currentWeekStart.setHours(0, 0, 0, 0)

    // 先週の開始日と終了日
    const lastWeekStart = new Date(currentWeekStart)
    lastWeekStart.setDate(currentWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(currentWeekStart)
    lastWeekEnd.setTime(lastWeekEnd.getTime() - 1) // 先週の最後の瞬間

    // 今週のセッション（今週月曜日〜現在まで）
    const thisWeekSessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.endTime)
      return sessionDate >= currentWeekStart && sessionDate <= now
    })

    // 先週のセッション（先週月曜日〜先週日曜日）
    const lastWeekSessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.endTime)
      return sessionDate >= lastWeekStart && sessionDate <= lastWeekEnd
    })

    // 今週の同じ曜日までの時間を公平に比較するため、
    // 先週の同じ期間（月曜日から現在の曜日まで）と比較
    const currentDayOfWeek = now.getDay()
    const lastWeekSameDate = new Date(lastWeekStart)
    lastWeekSameDate.setDate(lastWeekStart.getDate() + daysFromMonday)
    lastWeekSameDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds())

    const lastWeekSamePeriodSessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.endTime)
      return sessionDate >= lastWeekStart && sessionDate <= lastWeekSameDate
    })

    // 合計時間を計算（秒単位）
    const thisWeekTotal = thisWeekSessions.reduce((sum, session) => sum + session.duration, 0)
    const lastWeekTotal = lastWeekSamePeriodSessions.reduce((sum, session) => sum + session.duration, 0)

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
