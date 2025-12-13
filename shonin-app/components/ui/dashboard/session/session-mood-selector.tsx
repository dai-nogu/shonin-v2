"use client"

import { memo } from "react"
import { CloudRain, Cloud, Minus, Sun, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"

interface SessionMoodSelectorProps {
  mood: number
  setMood: (mood: number) => void
  isMobile?: boolean
}

const moodOptions = [
  { value: 5, icon: Sparkles, labelKey: 'active_session.mood_great', color: 'emerald' },
  { value: 4, icon: Sun, labelKey: 'active_session.mood_good', color: 'emerald' },
  { value: 3, icon: Minus, labelKey: 'active_session.mood_neutral', color: 'gray' },
  { value: 2, icon: Cloud, labelKey: 'active_session.mood_poor', color: 'gray' },
  { value: 1, icon: CloudRain, labelKey: 'active_session.mood_bad', color: 'gray' },
]

export const SessionMoodSelector = memo(function SessionMoodSelector({
  mood,
  setMood,
  isMobile = false
}: SessionMoodSelectorProps) {
  const t = useTranslations()

  if (isMobile) {
    return (
      <div className="space-y-3">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-white">
            {t('active_session.mood_question')}
          </h3>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {moodOptions.map(({ value, icon: Icon, labelKey }) => (
            <Button
              key={value}
              onClick={() => setMood(value)}
              variant={mood === value ? "default" : "outline"}
              className={cn(
                "w-full h-16 justify-start gap-4 text-base transition-all",
                mood === value
                  ? "bg-emerald-700 text-white scale-105 shadow-lg border-2 border-emerald-500"
                  : "hover:bg-secondary hover:scale-[1.02]"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                mood === value ? "bg-white/20" : "bg-secondary"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-semibold">{t(labelKey)}</span>
              {mood === value && (
                <Check className="w-5 h-5 ml-auto" />
              )}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // PC version
  return (
    <div className="space-y-3 mt-3">
      <Label className="text-base font-medium">{t('active_session.mood_question')}</Label>
      <div className="flex justify-between sm:justify-start sm:gap-4">
        {[1, 2, 3, 4, 5].map((rating) => {
          const Icon = moodOptions.find(opt => opt.value === rating)?.icon || Minus
          return (
            <Button
              key={rating}
              onClick={() => setMood(rating)}
              variant={mood === rating ? "default" : "outline"}
              className={cn(
                "h-14 w-14 p-0 flex items-center justify-center rounded-xl transition-all",
                mood === rating
                  ? "bg-emerald-700 text-white scale-110 shadow-lg shadow-emerald-900/20 ring-2 ring-emerald-700 ring-offset-2 ring-offset-background"
                  : "text-gray-400 hover:bg-secondary hover:scale-105"
              )}
            >
              <Icon className="w-6 h-6" />
            </Button>
          )
        })}
      </div>
    </div>
  )
})

