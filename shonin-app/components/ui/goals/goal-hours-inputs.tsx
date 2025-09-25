"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'

interface ValidationErrors {
  weekdayHours: string
  weekendHours: string
}

interface GoalHoursInputsProps {
  weekdayHours: string
  weekendHours: string
  onWeekdayHoursChange: (value: string) => void
  onWeekendHoursChange: (value: string) => void
  validationErrors: ValidationErrors
}

export function GoalHoursInputs({ 
  weekdayHours, 
  weekendHours, 
  onWeekdayHoursChange, 
  onWeekendHoursChange,
  validationErrors
}: GoalHoursInputsProps) {
  const t = useTranslations()
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <Label className="text-gray-300">{t('goals.weekday_hours_label')} *</Label>
        <Input
          type="text"
          value={weekdayHours}
          onChange={(e) => onWeekdayHoursChange(e.target.value)}
          placeholder="2"
          className="bg-gray-800 border-gray-700 text-white"
        />
        {validationErrors.weekdayHours && (
          <div className="text-xs text-red-400">{validationErrors.weekdayHours}</div>
        )}
      </div>
      <div className="space-y-1">
        <Label className="text-gray-300">{t('goals.weekend_hours_label')} *</Label>
        <Input
          type="text"
          value={weekendHours}
          onChange={(e) => onWeekendHoursChange(e.target.value)}
          placeholder="5"
          className="bg-gray-800 border-gray-700 text-white"
        />
        {validationErrors.weekendHours && (
          <div className="text-xs text-red-400">{validationErrors.weekendHours}</div>
        )}
      </div>
    </div>
  )
} 