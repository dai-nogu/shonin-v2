"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { useTranslations } from 'next-intl'
import { getWeekStart, getCurrentTime, getDateString } from "@/lib/date-utils"
import { formatDuration } from "@/lib/format-duration"
import { ChevronDown } from "lucide-react"
import type { CompletedSession } from "../time-tracker"

interface WeeklyLineChartProps {
  completedSessions: CompletedSession[]
}

type DateRange = 'week' | '2weeks' | 'month'

interface DayData {
  date: Date
  label: string
  totalSeconds: number
  sessions: CompletedSession[]
}

export function WeeklyLineChart({ completedSessions }: WeeklyLineChartProps) {
  const t = useTranslations()
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown="date-range"]')) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

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
    const data: DayData[] = []

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
        sessions: daySessions,
      })
    }

    return data
  }, [completedSessions, dateRange])

  // パスの長さを計算（初回とchartDataが変わった時のみ）
  useEffect(() => {
    setIsReady(false)
    // 次のフレームで計算を開始（DOMが更新されるのを待つ）
    const timer = setTimeout(() => {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength()
        setPathLength(length)
        setAnimationKey(prev => prev + 1)
        setIsReady(true)
      }
    }, 50) // 50msの遅延でDOMが確実に更新される
    
    return () => clearTimeout(timer)
  }, [chartData])

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
    <Card className="bg-transparent border-0 shadow-none group/card">
      <div className="rounded-xl border border-white/10 p-5 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-visible">
        {/* グローエフェクト用のオーバーレイ */}
        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
        </div>

        <CardHeader className="px-0 pt-0 pb-4 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl md:text-2xl font-bold">
            {t('weekly_chart.title')}
          </CardTitle>
          
          {/* 切り替えボタン - モダンなドロップダウン */}
          <div className="relative z-[100]" data-dropdown="date-range">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-[#0f1115]/80 hover:bg-[#0f1115] border border-white/10 rounded-lg transition-all duration-200 text-gray-300 hover:text-white backdrop-blur-sm ${
                isMenuOpen ? 'bg-[#0f1115] border-white/20 text-white shadow-lg' : ''
              }`}
            >
              <span>
                {dateRange === 'week' ? t('weekly_chart.this_week') : dateRange === '2weeks' ? t('weekly_chart.two_weeks') : t('weekly_chart.month')}
              </span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-gray-300' : ''}`} />
            </button>
            
            {/* ドロップダウンメニュー */}
            <div
              className={`absolute right-0 top-full mt-2 w-32 overflow-hidden rounded-xl border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl transition-all duration-200 origin-top-right z-[110] ${
                isMenuOpen 
                  ? 'opacity-100 scale-100 translate-y-0 visible' 
                  : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
              }`}
            >
              <div className="p-1 space-y-0.5">
                {([
                  { key: 'week', label: t('weekly_chart.this_week') },
                  { key: '2weeks', label: t('weekly_chart.two_weeks') },
                  { key: 'month', label: t('weekly_chart.month') },
                ] as { key: DateRange; label: string }[]).map((item) => (
                  <button
                    key={item.key}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setDateRange(item.key)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors ${
                      dateRange === item.key 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 relative">
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
            {/* スケルトンローディング（準備できるまで表示） */}
            {!isReady && (
              <div className="absolute inset-0 rounded-lg bg-gray-800/30 animate-pulse z-10" />
            )}
            <svg
              viewBox="0 0 100 60"
              preserveAspectRatio="none"
              className="w-full h-full"
              style={{ opacity: isReady ? 1 : 0 }}
            >
              {/* グラデーションの定義 */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                </linearGradient>
                
                {/* クリップパス用のアニメーション定義 */}
                <clipPath id={`revealClip-${animationKey}`}>
                  <rect 
                    x="0" 
                    y="0" 
                    width="0" 
                    height="60"
                  >
                    <animate
                      attributeName="width"
                      from="0"
                      to="100"
                      dur="1.5s"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                  </rect>
                </clipPath>
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
                clipPath={`url(#revealClip-${animationKey})`}
              />

              {/* 線 - 最後に描画して目立たせる */}
              <path
                key={`line-${animationKey}`}
                ref={pathRef}
                d={generatePath()}
                fill="none"
                stroke="#059669"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength || 1000}
                strokeDashoffset={pathLength || 1000}
                style={{
                  animation: `drawLine 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                }}
              />

              {/* データポイント */}
              {chartData.map((d, i) => {
                const x = 5 + (i / (chartData.length - 1)) * 90
                const y = 55 - (d.totalSeconds / maxSeconds) * 50
                const hasData = d.totalSeconds > 0
                const animationName = hasData ? 'fadeIn' : 'fadeInDim'
                // 線の進行に合わせてポイントを表示（線が到達した時に表示）
                const pointDelay = (i / (chartData.length - 1)) * 1.2
                return (
                  <circle
                    key={`${animationKey}-${i}`}
                    cx={x}
                    cy={y}
                    r={hoveredDay === i ? "2.5" : "1.5"}
                    fill="#059669"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredDay(i)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{ 
                      pointerEvents: 'all',
                      opacity: 0,
                      animation: `${animationName} 0.3s ease-out ${pointDelay}s forwards`,
                    }}
                  />
                )
              })}
            </svg>

            {/* ツールチップ */}
            {hoveredDay !== null && chartData[hoveredDay] && chartData[hoveredDay].sessions.length > 0 && (
              <div
                className="absolute z-50 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl p-3 min-w-[180px] max-w-[280px] pointer-events-none"
                style={{
                  left: `${((hoveredDay / (chartData.length - 1)) * 100)}%`,
                  top: '-10px',
                  transform: 'translate(-50%, -100%)',
                }}
              >
                {/* 日付とトータル時間 */}
                <div className="mb-2 pb-2 border-b border-white/10">
                  <div className="text-xs text-gray-400">{chartData[hoveredDay].date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</div>
                  <div className="text-sm font-bold text-emerald-500">
                    {formatDuration(chartData[hoveredDay].totalSeconds)}
                  </div>
                </div>

                {/* セッション一覧（名前のみ） */}
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                  {chartData[hoveredDay].sessions.map((session, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div 
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${session.activityColor || 'bg-gray-500'}`}
                      />
                      <span className="text-white text-xs truncate">{session.activityName}</span>
                    </div>
                  ))}
                </div>

                {/* 三角形の矢印 */}
                <div
                  className="absolute left-1/2 bottom-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/95"
                  style={{ transform: 'translate(-50%, 100%)' }}
                />
              </div>
            )}
          </div>
          
          {/* X軸ラベル */}
          {isReady && (
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
          )}
        </div>
      </CardContent>
      </div>
    </Card>
  )
}
