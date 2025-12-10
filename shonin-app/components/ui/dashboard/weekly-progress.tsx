"use client"

import { useState, useEffect } from "react"
import { BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { formatDuration } from "@/lib/format-duration"
import { useTranslations } from 'next-intl'
import { getWeekStart, getCurrentTime, getDateString } from "@/lib/date-utils"
import type { CompletedSession } from "./time-tracker"

interface WeeklyProgressProps {
  completedSessions: CompletedSession[]
  onWeekViewClick?: () => void
}

export function WeeklyProgress({ completedSessions, onWeekViewClick }: WeeklyProgressProps) {
  const t = useTranslations()
  const [isAnimated, setIsAnimated] = useState(false)
  
  // 今週の開始日（月曜日）を取得
  const today = getCurrentTime()
  const weekStart = getWeekStart(today)
  
  // 今日の曜日インデックス（月曜日=0, 日曜日=6）
  const todayDayOfWeek = today.getDay()
  const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1
  
  // 今週の各日のデータを計算
  const weekData = []
  const dayNames = [
    t('weekly_progress.days.monday'),
    t('weekly_progress.days.tuesday'),
    t('weekly_progress.days.wednesday'),
    t('weekly_progress.days.thursday'),
    t('weekly_progress.days.friday'),
    t('weekly_progress.days.saturday'),
    t('weekly_progress.days.sunday')
  ]

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dateString = getDateString(date)
    
    // その日のセッションを取得
    const daySessions = completedSessions.filter(session => {
      const sessionDateString = getDateString(session.startTime)
      return sessionDateString === dateString
    })

    // その日の合計時間を計算（秒単位で保持）
    const totalSeconds = daySessions.reduce((sum, session) => sum + session.duration, 0)

    // 進捗率を計算（1日24時間=86400秒を最大値とする）
    const targetSeconds = 24 * 3600 // 24時間を秒に変換
    const progress = Math.min((totalSeconds / targetSeconds) * 100, 100)

    weekData.push({
      day: dayNames[i],
      totalSeconds: totalSeconds,
      progress: progress
    })
  }

  const totalWeekSeconds = weekData.reduce((sum, day) => sum + day.totalSeconds, 0)

  // マウント時にアニメーションを開始
  useEffect(() => {
    // 少し遅延を入れてからアニメーション開始（ページ表示後に動き出す）
    const timer = setTimeout(() => {
      setIsAnimated(true)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div id="weekly-progress">
      <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center text-xl font-bold tracking-tight">
            <span className="text-[#fffffC]">
               {t('weekly_progress.title')}
            </span>
          </CardTitle>
          <Button
            onClick={onWeekViewClick}
            variant="ghost"
            size="sm"
            className="text-emerald-500 hover:bg-white/5 text-xs lg:text-sm rounded-full px-3 transition-all duration-300 hover:scale-[1.02]"
          >
            <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1.5" />
            {t('weekly_progress.week_view')}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="px-0">
        <div className="rounded-xl border border-white/10 p-5 shadow-lg transition-all duration-300 hover:border-white/20">
           <div className="space-y-3 lg:space-y-4">
            {weekData.map((day, index) => (
              <div key={day.day} className="flex items-center group">
                <span className="text-gray-400 w-8 lg:w-10 text-xs lg:text-sm font-medium group-hover:text-gray-200 transition-colors">{day.day}</span>
                
                <div className="flex-1 mx-2">
                  <div className="relative h-2 lg:h-2.5 w-full overflow-hidden rounded-full bg-gray-800/80">
                    <div
                      className="h-full bg-emerald-700 rounded-full"
                      style={{
                        // 今日だけアニメーション、他の日は最初から表示
                        width: index === todayIndex 
                          ? (isAnimated ? `${day.progress}%` : '0%')
                          : `${day.progress}%`,
                        transition: index === todayIndex 
                          ? 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
                          : 'none',
                      }}
                    />
                  </div>
                </div>
                
                <span className={`text-[10px] lg:text-xs w-16 lg:w-20 text-right whitespace-nowrap ${
                   day.totalSeconds > 0 ? "text-white font-medium" : "text-gray-600"
                }`}>
                  {formatDuration(day.totalSeconds)}
                </span>
              </div>
            ))}
    
            <div className="pt-4 mt-2 border-t border-white/5">
              <div className="text-center flex flex-col items-center justify-center min-h-[60px]">
                {totalWeekSeconds === 0 ? (
                  <div className="flex flex-col items-center opacity-50">
                    <div className="p-2 rounded-full bg-white/5 mb-1">
                      <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500">{t('common.no_records')}</div>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="text-xs text-gray-400 mb-1 tracking-widest">{t('common.total')}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-500 drop-shadow-sm">
                      {formatDuration(totalWeekSeconds)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </div>
  )
}
