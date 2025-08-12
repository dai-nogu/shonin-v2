import { Card, CardContent } from "@/components/ui/card"
import { formatTime } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { getTodaySessionsInTimezone } from "@/lib/timezone-utils"
import type { CompletedSession } from "./time-tracker"
import { useUserProfile } from "@/hooks/use-user-profile"

interface WelcomeCardProps {
  completedSessions: CompletedSession[]
}

export function WelcomeCard({ completedSessions }: WelcomeCardProps) {
  // タイムゾーンを取得
  const { timezone } = useTimezone()
  
  // ユーザープロフィールを取得
  const { profile } = useUserProfile()
  
  // 今日のセッションを取得（タイムゾーン考慮）
  const todaysSessions = getTodaySessionsInTimezone(completedSessions, timezone)

  // 今日の合計時間を計算（秒を時間に変換）
  const totalSeconds = todaysSessions.reduce((sum, session) => sum + session.duration, 0)
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

  // 挨拶メッセージを取得する関数
  const getGreeting = () => {
    const now = new Date()
    
    // 現在の時間を取得（タイムゾーン考慮）
    const hour = parseInt(now.toLocaleTimeString('ja-JP', { 
      timeZone: timezone,
      hour: '2-digit',
      hour12: false 
    }).split(':')[0])
    
    // 時間帯による挨拶を判定
    let baseGreeting = ''
    if (hour >= 5 && hour <= 11) {
      baseGreeting = 'おはようございます'
    } else if (hour >= 12 && hour <= 16) {
      baseGreeting = 'こんにちは'
    } else {
      baseGreeting = 'こんばんは'
    }
    
    // ユーザー名を取得
    const userName = profile?.name || ''
    
    // 常に「○○さん、挨拶文」の形式で返す
    return `${userName}さん、${baseGreeting}`
  }

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
          <h2 className="text-xl lg:text-2xl font-bold mb-1">{getGreeting()}</h2>
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
