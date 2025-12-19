"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { useTranslations } from 'next-intl'
import { getWeekStart, getCurrentTime, getDateString } from "@/lib/date-utils"
import { formatDuration } from "@/lib/format-duration"
import type { CompletedSession } from "../time-tracker"

interface WeeklyLineChartProps {
  completedSessions: CompletedSession[]
}

type DateRange = 'week' | '2weeks' | 'month'

export function WeeklyLineChart({ completedSessions }: WeeklyLineChartProps) {
  const t = useTranslations()
  const [dateRange, setDateRange] = useState<DateRange>('week')

  // 日数を取得
  const getDaysCount = () => {
    switch (dateRange) {
      case 'week': return 7
      case '2weeks': return 14
      case 'month': return 30
    }
  }

  // 日付ラベルを取得
  const getDateLabel = (date: Date) => {
    const day = date.getDate()
    const dayOfWeek = date.getDay()
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    return dateRange === 'week' ? dayNames[dayOfWeek] : `${date.getMonth() + 1}/${day}`
  }

  // チャートデータを計算
  const chartData = useMemo(() => {
    const daysCount = getDaysCount()
    const today = getCurrentTime()
    const data: { date: Date; label: string; totalSeconds: number }[] = []

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateString = getDateString(date)

      const daySessions = completedSessions.filter(session => {
        const sessionDateString = getDateString(session.startTime)
        return sessionDateString === dateString
      })

      const totalSeconds = daySessions.reduce((sum, session) => sum + session.duration, 0)

      data.push({
        date,
        label: getDateLabel(date),
        totalSeconds,
      })
    }

    return data
  }, [completedSessions, dateRange])

  // 最大値を計算（グラフのスケーリング用）
  const maxSeconds = Math.max(...chartData.map(d => d.totalSeconds), 3600) // 最低1時間

  // 合計時間
  const totalSeconds = chartData.reduce((sum, d) => sum + d.totalSeconds, 0)

  // SVGパスを生成
  const generatePath = () => {
    const width = 100
    const height = 60
    const padding = 5

    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2)
      const y = height - padding - (d.totalSeconds / maxSeconds) * (height - padding * 2)
      return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
  }

  // エリアパスを生成
  const generateAreaPath = () => {
    const width = 100
    const height = 60
    const padding = 5

    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - padding * 2)
      const y = height - padding - (d.totalSeconds / maxSeconds) * (height - padding * 2)
      return `${x},${y}`
    })

    const firstX = padding
    const lastX = padding + ((chartData.length - 1) / (chartData.length - 1)) * (width - padding * 2)

    return `M ${firstX},${height - padding} L ${points.join(' L ')} L ${lastX},${height - padding} Z`
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl md:text-2xl font-bold">
            {t('weekly_chart.title')}
          </CardTitle>
          
          {/* 切り替えボタン */}
          <div className="flex bg-gray-900/50 p-1 rounded-lg border border-white/10">
            {([
              { key: 'week', label: t('weekly_chart.this_week') },
              { key: '2weeks', label: t('weekly_chart.two_weeks') },
              { key: 'month', label: t('weekly_chart.month') },
            ] as { key: DateRange; label: string }[]).map((item) => (
              <button
                key={item.key}
                onClick={() => setDateRange(item.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  dateRange === item.key 
                    ? "bg-white/10 text-white" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="rounded-xl border border-white/10 p-5">
          {/* 合計表示 */}
          <div className="mb-4 text-center">
            <div className="text-xs text-gray-400 mb-1">{t('common.total')}</div>
            <div className="text-2xl font-bold text-emerald-500">
              {formatDuration(totalSeconds)}
            </div>
          </div>

          {/* 線グラフ */}
          <div className="relative h-32">
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              {/* グラデーションの定義 */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* グリッド線 */}
              {[0, 25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="5"
                  y1={5 + (y / 100) * 50}
                  x2="95"
                  y2={5 + (y / 100) * 50}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.5"
                />
              ))}

              {/* エリア */}
              <path
                d={generateAreaPath()}
                fill="url(#areaGradient)"
              />

              {/* 線 */}
              <path
                d={generatePath()}
                fill="none"
                stroke="#059669"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* データポイント */}
              {chartData.map((d, i) => {
                const x = 5 + (i / (chartData.length - 1)) * 90
                const y = 55 - (d.totalSeconds / maxSeconds) * 50
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill="#059669"
                    className={d.totalSeconds > 0 ? 'opacity-100' : 'opacity-30'}
                  />
                )
              })}
            </svg>
          </div>

          {/* X軸ラベル */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {dateRange === 'week' ? (
              chartData.map((d, i) => (
                <span key={i} className="w-8 text-center">{d.label}</span>
              ))
            ) : (
              <>
                <span>{chartData[0]?.label}</span>
                <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
                <span>{chartData[chartData.length - 1]?.label}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
