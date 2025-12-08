"use client"

import { Play, Pause, Clock, Target, Square } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Badge } from "@/components/ui/common/badge"
import { useTranslations } from 'next-intl'
import { useSessions } from "@/contexts/sessions-context"
import type { SessionData } from "./time-tracker"
import { cn } from "@/lib/utils"

interface ActiveActivitySidebarProps {
  activeSession: SessionData | null
  isActive: boolean
  onViewSession: () => void
  onTogglePause: () => void
  onEnd: () => void
  sessionState: "active" | "paused" | "ended"
  isDashboard?: boolean
}

export function ActiveActivitySidebar({ 
  activeSession, 
  isActive, 
  onViewSession, 
  onTogglePause,
  onEnd,
  sessionState,
  isDashboard = false
}: ActiveActivitySidebarProps) {
  const t = useTranslations()
  // セッションコンテキストから一元化された時間データを取得
  const { elapsedTime, formattedTime } = useSessions()

  const getStatusInfo = () => {
    switch (sessionState) {
      case "active":
        return { color: "bg-emerald-700", text: t('active_session.recording'), icon: "🟢" }
      case "paused":
        return { color: "bg-yellow-500", text: t('active_session.paused'), icon: "⏸️" }
      case "ended":
        return { color: "bg-blue-500", text: t('active_session.reflecting'), icon: "✏️" }
    }
  }

  if (!isActive || !activeSession) {
    return null
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className="backdrop-blur-md bg-card/50 border-white/10 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base font-medium text-foreground/80">
          <Clock className="w-4 h-4 mr-2 text-primary" />
          {t('active_session.recording')}...
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 行動名 */}
        <div>
          <h3 className="text-foreground font-bold text-lg leading-tight mb-1">{activeSession.activityName}</h3>
        </div>

        {/* 経過時間 */}
        <div className="text-center py-2">
          <div className={cn("text-3xl font-bold tabular-nums",
             sessionState === "paused" ? "text-yellow-500" : "text-emerald-600"
          )}>
            {formattedTime}
          </div>
        </div>

        {/* 目標時間の進捗 */}
        {activeSession.targetTime && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>{t('active_session.target')}</span>
              <span>
                {Math.floor(activeSession.targetTime / 60)}{t('time.hours_unit')}
                {activeSession.targetTime % 60 > 0 && ` ${activeSession.targetTime % 60}${t('time.minutes_unit')}`}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500",
                  elapsedTime >= activeSession.targetTime * 60
                    ? "bg-emerald-700 shadow-[0_0_8px_rgba(4,120,87,0.5)]"
                    : elapsedTime >= activeSession.targetTime * 60 * 0.8
                    ? "bg-yellow-500"
                    : "bg-primary"
                )}
                style={{
                  width: `${Math.min((elapsedTime / (activeSession.targetTime * 60)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-muted-foreground text-right font-medium">
              {Math.round((elapsedTime / (activeSession.targetTime * 60)) * 100)}%
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-2 pt-1">
          <Button
            onClick={onViewSession}
            size="sm"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
          >
            {t('common.details')}
          </Button>
          
          {!isDashboard && sessionState !== "ended" && (
            <div className="flex space-x-2">
              <Button
                onClick={onTogglePause}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-secondary border-white/10"
              >
                {sessionState === "paused" ? (
                  <>
                    <Play className="w-3 h-3 mr-1 fill-current" />
                    {t('active_session.resume')}
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1 fill-current" />
                    {t('active_session.pause')}
                  </>
                )}
              </Button>
              
              <Button
                onClick={onEnd}
                size="sm"
                variant="destructive"
                className="flex-1 shadow-md hover:shadow-red-900/20"
              >
                <Square className="w-3 h-3 mr-1 fill-current" />
                {t('active_session.end')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 