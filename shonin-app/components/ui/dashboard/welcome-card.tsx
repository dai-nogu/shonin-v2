"use client"

import { Card, CardContent } from "@/components/ui/common/card"
import { formatTime } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { getTodaySessionsInTimezone } from "@/lib/timezone-utils"
import { useTranslations, useLocale } from 'next-intl'
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
  
  // 翻訳機能とロケールを取得
  const t = useTranslations()
  const locale = useLocale()
  
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
    const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US'
    const hour = parseInt(now.toLocaleTimeString(localeCode, { 
      timeZone: timezone,
      hour: '2-digit',
      hour12: false 
    }).split(':')[0])
    
    // 時間帯による挨拶を判定
    let greetingKey = ''
    if (hour >= 5 && hour <= 11) {
      greetingKey = 'dashboard.greeting.morning'
    } else if (hour >= 12 && hour <= 16) {
      greetingKey = 'dashboard.greeting.afternoon'
    } else {
      greetingKey = 'dashboard.greeting.evening'
    }
    
    // ユーザー名を取得
    const userName = profile?.name || ''
    const userSuffix = t('dashboard.greeting.userSuffix')
    
    // 改行表示用の表示を返すオブジェクト
    return {
      userName: userName ? `${userName}${userSuffix}` : '',
      greeting: t(greetingKey)
    }
  }

  // 現在時刻（タイムゾーン考慮）
  const localeCode = locale === 'ja' ? 'ja-JP' : 'en-US'
  const currentTime = new Date().toLocaleTimeString(localeCode, { 
    timeZone: timezone,
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return (
    <Card className="bg-green-500 border-0 text-white">
      <CardContent className="p-2 lg:p-4">
        <div>
          {/* PC・SP共通：改行表示 */}
          <div>
            {getGreeting().userName && (
              <h2 className="text-xl lg:text-2xl font-bold">{getGreeting().userName}</h2>
            )}
            <h2 className="text-xl lg:text-2xl font-bold mb-1">{getGreeting().greeting}</h2>
          </div>
          
          <p className="text-green-100 opacity-90 text-sm mt-3">{t('dashboard.encouragement')}</p>
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
