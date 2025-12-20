"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'
import { getCurrentTime, getDateString } from "@/lib/date-utils"
import type { CompletedSession } from "../time-tracker"

interface TodayTimeChartProps {
  completedSessions: CompletedSession[]
}

type TimeRange = '6h' | '12h' | '24h'

export function TodayTimeChart({ completedSessions }: TodayTimeChartProps) {
  const t = useTranslations()
  const [timeRange, setTimeRange] = useState<TimeRange>('12h')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  
  // 今日のセッション時間を計算
  const todayTotalSeconds = useMemo(() => {
    const today = getCurrentTime()
    const todayString = getDateString(today)
    
    return completedSessions
      .filter(session => {
        const sessionDateString = getDateString(session.startTime)
        return sessionDateString === todayString
      })
      .reduce((sum, session) => sum + session.duration, 0)
  }, [completedSessions])

  // データまたは時間範囲が変わったらアニメーションをトリガー
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [todayTotalSeconds, timeRange])

  // 時間と分に変換
  const hours = Math.floor(todayTotalSeconds / 3600)
  const minutes = Math.floor((todayTotalSeconds % 3600) / 60)

  // 目標時間（秒単位）
  const targetSeconds = {
    '6h': 6 * 3600,
    '12h': 12 * 3600,
    '24h': 24 * 3600,
  }[timeRange]

  // 進捗率
  const progressPercentage = Math.min((todayTotalSeconds / targetSeconds) * 100, 100)

  // 円グラフのパラメータ
  const radius = 80
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl md:text-2xl font-bold">
            {t('today_time.title')}
          </CardTitle>
          
          {/* 切り替えボタン - ホバーで展開 */}
          <div className="relative z-50">
            <button
              onMouseEnter={() => setIsMenuOpen(true)}
              onMouseLeave={() => setIsMenuOpen(false)}
              className={`px-3 py-1.5 text-xs font-medium bg-gray-900 backdrop-blur-sm border border-white/10 transition-all duration-200 min-w-[60px] text-white ${
                isMenuOpen ? 'rounded-t-lg' : 'rounded-lg hover:bg-gray-700'
              }`}
            >
              {timeRange}
            </button>
            
            {/* ドロップダウンコンテンツ - 残りの選択肢のみ */}
            {isMenuOpen && (
              <div
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
                className="absolute right-0 top-full w-full overflow-hidden"
                style={{
                  animation: 'slideDown 0.2s ease-out'
                }}
              >
                {(['6h', '12h', '24h'] as TimeRange[]).filter(range => range !== timeRange).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setTimeRange(range)
                      setIsMenuOpen(false)
                    }}
                    className="w-full px-3 py-1.5 text-xs font-medium text-left transition-colors text-white bg-gray-900 backdrop-blur-sm border border-white/10 border-t-0 first:border-t-0 last:rounded-b-lg hover:bg-gray-700"
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="rounded-xl border border-white/10 p-6">
          {/* 円グラフ */}
          <div className="flex justify-center">
            <div className="relative">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* 背景の円 */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={strokeWidth}
                />
                {/* 進捗の円 */}
                <circle
                  key={`progress-${animationKey}`}
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 100 100)"
                  style={{
                    animation: `drawCircle 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                  }}
                />
              </svg>
              
              {/* 中央のテキスト */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl md:text-4xl font-bold text-white">
                  {hours > 0 ? (
                    <>
                      <span>{hours}</span>
                      <span className="text-lg text-gray-400 ml-1">h</span>
                      <span className="ml-2">{minutes}</span>
                      <span className="text-lg text-gray-400 ml-1">m</span>
                    </>
                  ) : (
                    <>
                      <span>{minutes}</span>
                      <span className="text-lg text-gray-400 ml-1">min</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  / {timeRange}
                </div>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
