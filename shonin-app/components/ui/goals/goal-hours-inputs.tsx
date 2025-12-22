"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations, useLocale } from 'next-intl'
import { useState, useMemo } from "react"
import { Plus, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/common/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"

interface ValidationErrors {
  weekdayHours: string
  weekendHours: string
}

interface GoalHoursInputsProps {
  deadline: string
  onDeadlineChange: (value: string) => void
  weekdayHours: string
  weekendHours: string
  onWeekdayHoursChange: (value: string) => void
  onWeekendHoursChange: (value: string) => void
  validationErrors: ValidationErrors
}

export function GoalHoursInputs({ 
  deadline,
  onDeadlineChange,
  weekdayHours, 
  weekendHours, 
  onWeekdayHoursChange, 
  onWeekendHoursChange,
  validationErrors
}: GoalHoursInputsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [isExpanded, setIsExpanded] = useState(false)
  
  // deadlineから年月日を分解（先頭ゼロを削除してSelectItemのvalueと一致させる）
  const { year, month, day } = useMemo(() => {
    if (!deadline) {
      return { year: '', month: '', day: '' }
    }
    const [y, m, d] = deadline.split('-')
    return { 
      year: y || '', 
      month: m ? parseInt(m, 10).toString() : '', 
      day: d ? parseInt(d, 10).toString() : '' 
    }
  }, [deadline])

  // 年のオプション（現在年から+10年まで）
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => currentYear + i)
  }, [])

  // 月のオプション（1-12月）
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])

  // 日のオプション（1-31日）
  const days = useMemo(() => {
    if (!year || !month) return Array.from({ length: 31 }, (_, i) => i + 1)
    
    // 選択された年月の日数を取得
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [year, month])

  const handleYearChange = (newYear: string) => {
    const m = month || '01'
    const d = day || '01'
    onDeadlineChange(`${newYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }

  const handleMonthChange = (newMonth: string) => {
    const y = year || new Date().getFullYear().toString()
    const d = day || '01'
    onDeadlineChange(`${y}-${newMonth.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }

  const handleDayChange = (newDay: string) => {
    const y = year || new Date().getFullYear().toString()
    const m = month || '01'
    onDeadlineChange(`${y}-${m.padStart(2, '0')}-${newDay.padStart(2, '0')}`)
  }
  
  return (
    <div className="space-y-2">
      {/* 追加ボタン */}
      <div 
        className={`flex justify-start overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
        }`}
      >
      </div>
    </div>
  )
} 