"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { useTranslations, useLocale } from 'next-intl'
import { getInputLimits } from "@/lib/input-limits"

interface GoalTitleInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function GoalTitleInput({ 
  value, 
  onChange, 
  placeholder
}: GoalTitleInputProps) {
  const t = useTranslations()
  const locale = useLocale()
  const limits = getInputLimits(locale)
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-gray-300">{t('goals.goal_label')} *</Label>
        <CharacterCounter current={value.length} max={limits.goalTitle} />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, limits.goalTitle))}
        maxLength={limits.goalTitle}
        placeholder={placeholder || t('goals.goal_placeholder')}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 