"use client"

import { Textarea } from "@/components/ui/common/textarea"
import { Label } from "@/components/ui/common/label"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { useTranslations, useLocale } from 'next-intl'
import { getInputLimits } from "@/lib/input-limits"

interface GoalMotivationTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function GoalMotivationTextarea({ 
  value, 
  onChange, 
  placeholder
}: GoalMotivationTextareaProps) {
  const t = useTranslations()
  const locale = useLocale()
  const limits = getInputLimits(locale)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-gray-300">{t('goals.motivation_label')} *</Label>
        <CharacterCounter current={value.length} max={limits.goalMotivation} />
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, limits.goalMotivation))}
        maxLength={limits.goalMotivation}
        placeholder={placeholder || t('goals.motivation_placeholder')}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 