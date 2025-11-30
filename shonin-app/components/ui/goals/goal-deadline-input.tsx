"use client"

import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { useMemo } from "react"

interface GoalDeadlineInputProps {
  value: string
  onChange: (value: string) => void
}

export function GoalDeadlineInput({ value, onChange }: GoalDeadlineInputProps) {
  const t = useTranslations()
  
  // valueから年月日を分解
  const { year, month, day } = useMemo(() => {
    if (!value) {
      return { year: '', month: '', day: '' }
    }
    const [y, m, d] = value.split('-')
    return { year: y || '', month: m || '', day: d || '' }
  }, [value])

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
    onChange(`${newYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }

  const handleMonthChange = (newMonth: string) => {
    const y = year || new Date().getFullYear().toString()
    const d = day || '01'
    onChange(`${y}-${newMonth.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }

  const handleDayChange = (newDay: string) => {
    const y = year || new Date().getFullYear().toString()
    const m = month || '01'
    onChange(`${y}-${m.padStart(2, '0')}-${newDay.padStart(2, '0')}`)
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{t('goals.deadline_label_required')} *</Label>
      <div className="grid grid-cols-3 gap-2">
        {/* 年 */}
        <Select value={year} onValueChange={handleYearChange}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()} className="text-white hover:bg-gray-700">
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 月 */}
        <Select value={month} onValueChange={handleMonthChange}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="月" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {months.map((m) => (
              <SelectItem key={m} value={m.toString()} className="text-white hover:bg-gray-700">
                {m}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 日 */}
        <Select value={day} onValueChange={handleDayChange}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="日" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {days.map((d) => (
              <SelectItem key={d} value={d.toString()} className="text-white hover:bg-gray-700">
                {d}日
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 