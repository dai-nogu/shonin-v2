"use client"

import { BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Progress } from "@/components/ui/common/progress"
import { formatDuration } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import { useTranslations } from 'next-intl'
import { getWeekStartInTimezone, getCurrentTimeInTimezone, getDateStringInTimezone } from "@/lib/timezone-utils"
import type { CompletedSession } from "./time-tracker"

interface WeeklyProgressProps {
  completedSessions: CompletedSession[]
  onWeekViewClick?: () => void
}

export function WeeklyProgress({ completedSessions, onWeekViewClick }: WeeklyProgressProps) {
  const t = useTranslations()
  // タイムゾーンを取得
  const { timezone } = useTimezone()
  
  // 今週の開始日（月曜日）を取得（タイムゾーン考慮）
  const today = getCurrentTimeInTimezone(timezone)
  const weekStart = getWeekStartInTimezone(today, timezone)
  
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
    const dateString = getDateStringInTimezone(date, timezone)
    
    // その日のセッションを取得（タイムゾーン考慮）
    const daySessions = completedSessions.filter(session => {
      const sessionDateString = getDateStringInTimezone(session.startTime, timezone)
      return sessionDateString === dateString
    })

    // その日の合計時間を計算（秒単位で保持）
    const totalSeconds = daySessions.reduce((sum, session) => sum + session.duration, 0)

    // 進捗率を計算（1日4時間=14400秒を目標とする）
    const targetSeconds = 4 * 3600 // 4時間を秒に変換
    const progress = Math.min((totalSeconds / targetSeconds) * 100, 100)

    weekData.push({
      day: dayNames[i],
      totalSeconds: totalSeconds,
      progress: progress
    })
  }

  const totalWeekSeconds = weekData.reduce((sum, day) => sum + day.totalSeconds, 0)

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
            {weekData.map((day) => (
              <div key={day.day} className="flex items-center group">
                <span className="text-gray-400 w-8 lg:w-10 text-xs lg:text-sm font-medium group-hover:text-gray-200 transition-colors">{day.day}</span>
                
                <div className="flex-1 mx-2">
                  <Progress 
                    value={day.progress} 
                    max={100} 
                    className="h-2 lg:h-2.5 bg-gray-800/80" 
                    variant="liquid"
                  />
                </div>
                
                <span className={`text-xs lg:text-sm w-12 lg:w-14 text-right font-mono ${
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
                    <div className="text-xs text-gray-400 mb-1 uppercase tracking-widest">{t('common.total')}</div>
                    <div className="text-2xl lg:text-3xl font-bold text-emerald-500 drop-shadow-sm font-mono">
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
