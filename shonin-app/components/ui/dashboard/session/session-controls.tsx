"use client"

import { memo } from "react"
import { Pause, Play, Square, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'

interface SessionControlsProps {
  sessionState: "active" | "paused" | "ended"
  onTogglePause: () => void
  onEnd: () => void
  onResume: () => void
}

export const SessionControls = memo(function SessionControls({
  sessionState,
  onTogglePause,
  onEnd,
  onResume
}: SessionControlsProps) {
  const t = useTranslations()

  if (sessionState === "ended") {
    return (
      <div className="flex justify-center items-center gap-4 pt-4">
        <Button
          onClick={onResume}
          variant="outline"
          size="lg"
          className="h-20 px-12 text-xl font-semibold hover:bg-secondary/80 border-white/10 rounded-full w-full max-w-md shadow-lg"
        >
          <RotateCcw className="w-7 h-7 mr-3" />
          {t('active_session.resume')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center gap-4 pt-4">
      <Button
        onClick={onTogglePause}
        variant="outline"
        size="lg"
        className="h-16 px-8 rounded-full border-2 hover:bg-secondary/80 border-white/10 backdrop-blur-sm"
      >
        {sessionState === "paused" ? (
          <>
            <Play className="w-6 h-6 mr-2 fill-current" />
            {t('active_session.resume')}
          </>
        ) : (
          <>
            <Pause className="w-6 h-6 mr-2 fill-current" />
            {t('active_session.pause')}
          </>
        )}
      </Button>

      <Button 
        onClick={onEnd} 
        variant="destructive" 
        size="lg" 
        className="h-16 px-8 rounded-full shadow-lg hover:shadow-red-900/20 transition-all hover:-translate-y-0.5"
      >
        <Square className="w-6 h-6 mr-2 fill-current" />
        {t('active_session.end')}
      </Button>
    </div>
  )
})

