"use client"

import { Textarea } from "@/components/ui/common/textarea"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'

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
  
  return (
    <div className="space-y-1">
      <Label className="text-gray-300">{t('goals.motivation_label')} *</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('goals.motivation_placeholder')}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 