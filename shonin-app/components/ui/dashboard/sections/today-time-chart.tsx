"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'
import { getCurrentTime, getDateString } from "@/lib/date-utils"
import { ChevronDown } from "lucide-react"
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
  
  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown="time-range"]')) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])
  
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
    <Card className="bg-transparent border-0 shadow-none group/card">
      <div className="rounded-xl border border-white/10 p-6 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-visible">
        {/* グローエフェクト用のオーバーレイ */}
        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl overflow-hidden -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
        </div>

        <CardHeader className="px-0 pt-0 pb-4 relative">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-xl md:text-2xl font-bold">
            {t('today_time.title')}
          </CardTitle>
          
          {/* 切り替えボタン - モダンなドロップダウン */}
          <div className="relative z-[100]" data-dropdown="time-range">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-[#0f1115]/80 hover:bg-[#0f1115] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-gray-300 hover:text-white backdrop-blur-sm ${
                isMenuOpen ? 'bg-[#0f1115] border-white/20 text-white shadow-lg' : ''
              }`}
            >
              <span>{timeRange}</span>
              <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-gray-300' : ''}`} />
            </button>
            
            {/* ドロップダウンメニュー */}
            <div
              className={`absolute right-0 top-full mt-2 w-24 overflow-hidden rounded-xl border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl transition-all duration-200 origin-top-right z-[110] ${
                isMenuOpen 
                  ? 'opacity-100 scale-100 translate-y-0 visible' 
                  : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
              }`}
            >
              <div className="p-1 space-y-0.5">
                {(['6h', '12h', '24h'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setTimeRange(range)
                      setIsMenuOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors ${
                      timeRange === range 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 relative">
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
      </div>
    </Card>
  )
}
