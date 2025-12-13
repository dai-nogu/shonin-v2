"use client"

import { memo } from "react"
import { PenLine } from "lucide-react"
import { useTranslations } from 'next-intl'

interface SessionCompletionMessageProps {
  completedDurationMinutes: number
  isPreparingReflection: boolean
}

export const SessionCompletionMessage = memo(function SessionCompletionMessage({
  completedDurationMinutes,
  isPreparingReflection
}: SessionCompletionMessageProps) {
  const t = useTranslations()
  const encouragementMessages = useTranslations('encouragement')

  if (completedDurationMinutes <= 0) return null

  return (
    <div className="space-y-2 mt-2 text-center">
      <p className="text-foreground font-medium" dangerouslySetInnerHTML={{ __html: t('active_session.completed_message') }} />
      
      {/* プレースホルダー生成してる感じのアニメーション */}
      {isPreparingReflection && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            {/* メモ帳のライン */}
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-3 pt-2">
              <div className="h-1 bg-emerald-600/30 rounded-full w-12 animate-[line-draw_1.5s_ease-in-out_infinite]" />
              <div className="h-1 bg-emerald-600/30 rounded-full w-16 animate-[line-draw_1.5s_ease-in-out_0.3s_infinite]" />
              <div className="h-1 bg-emerald-600/30 rounded-full w-10 animate-[line-draw_1.5s_ease-in-out_0.6s_infinite]" />
            </div>
            {/* ペンアイコン */}
            <div className="absolute top-2 right-2 animate-writing">
              <PenLine className="w-10 h-10 text-emerald-600 fill-emerald-100/10" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            {t('active_session.preparing_reflection')}
          </p>
        </div>
      )}
    </div>
  )
})

