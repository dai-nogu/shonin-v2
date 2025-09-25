"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'

interface GoalDeadlineInputProps {
  value: string
  onChange: (value: string) => void
}

export function GoalDeadlineInput({ value, onChange }: GoalDeadlineInputProps) {
  const t = useTranslations()
  
  return (
    <div className="space-y-1">
      <Label className="text-gray-300">{t('goals.deadline_label_required')} *</Label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 