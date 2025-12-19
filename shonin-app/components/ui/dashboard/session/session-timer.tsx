"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/common/card"
import { useTranslations } from 'next-intl'
import { getTimeString } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface SessionTimerProps {
  activityName: string
  formattedTime: string
  startTime: Date
  elapsedTime: number
  targetTime?: number
  sessionState: "active" | "paused" | "ended"
}

export const SessionTimer = memo(function SessionTimer({
  activityName,
  formattedTime,
  startTime,
  elapsedTime,
  targetTime,
  sessionState
}: SessionTimerProps) {
  const t = useTranslations()

  return (
    <Card className="backdrop-blur-xl bg-card/50 border-white/10 shadow-2xl rounded-lg">
      <CardHeader className="text-center pb-4">
        <h2 className="text-4xl font-bold">{activityName}</h2>
      </CardHeader>

      <CardContent className="text-center">
        {/* 経過時間表示 */}
        <div
          className="text-7xl md:text-8xl font-bold tabular-nums transition-colors py-4 text-emerald-600"
        >
          {formattedTime}
        </div>
        <div className="text-muted-foreground text-sm font-medium">
          {t('active_session.start_time')}:{" "}
          {getTimeString(startTime, '24h').substring(0, 5)}
        </div>
        
        {/* 目標時間と進捗表示 */}
        {!!(targetTime && targetTime > 0) && (
          <div className="space-y-3 mt-8 max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
              <span>
                {t('active_session.target')}: {Math.floor(targetTime / 60)}{t('time.hours_unit')}
                {targetTime % 60 > 0 && `${targetTime % 60}${t('time.minutes_unit')}`}
              </span>
              <span>
                {Math.round((elapsedTime / (targetTime * 60)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  elapsedTime >= targetTime * 60
                    ? "bg-emerald-700 shadow-[0_0_15px_rgba(4,120,87,0.6)]"
                    : elapsedTime >= targetTime * 60 * 0.8
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                )}
                style={{
                  width: `${Math.min((elapsedTime / (targetTime * 60)) * 100, 100)}%`,
                }}
              />
            </div>
            {elapsedTime >= targetTime * 60 && (
              <div className="text-sm text-emerald-500 font-medium animate-pulse flex items-center justify-center gap-1">
                 {t('active_session.goal_achieved')}
              </div>
            )}
          </div>
        )}

        {/* 状態別メッセージ */}
        {sessionState === "paused" && (
          <div className="text-center p-4">
            <p className="text-yellow-500 text-sm font-medium" dangerouslySetInnerHTML={{ __html: t('active_session.paused_message') }} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

