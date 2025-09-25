"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'

interface GoalTitleInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function GoalTitleInput({ 
  value, 
  onChange, 
  placeholder = "〇〇までに転職を成功させる" 
}: GoalTitleInputProps) {
  const t = useTranslations()
  
  return (
    <div className="space-y-1">
      <Label className="text-gray-300">{t('goals.goal_label')} *</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 