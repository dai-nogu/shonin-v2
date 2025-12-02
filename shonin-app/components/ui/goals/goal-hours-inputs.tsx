"use client"

import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { useState, useMemo } from "react"
import { Plus, X } from "lucide-react"
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
        className={`flex justify-end overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'
        }`}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          {t('goals.add_deadline_and_time_settings')}
        </Button>
      </div>
      
      {/* 展開コンテンツ */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-3 border border-gray-700 rounded-lg p-3 bg-gray-800/50">
          <div className="flex justify-between items-center">
            <Label className="text-gray-300 text-xs">{t('goals.deadline_and_time_settings_label')}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* 期限入力 */}
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-xs">{t('goals.deadline_label')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {/* 年 */}
              <Select value={year} onValueChange={handleYearChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8">
                  <SelectValue placeholder="年" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()} className="text-white hover:bg-gray-700 text-xs">
                      {y}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 月 */}
              <Select value={month} onValueChange={handleMonthChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8">
                  <SelectValue placeholder="月" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {months.map((m) => (
                    <SelectItem key={m} value={m.toString()} className="text-white hover:bg-gray-700 text-xs">
                      {m}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 日 */}
              <Select value={day} onValueChange={handleDayChange}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white text-xs h-8">
                  <SelectValue placeholder="日" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {days.map((d) => (
                    <SelectItem key={d} value={d.toString()} className="text-white hover:bg-gray-700 text-xs">
                      {d}日
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 時間設定 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">{t('goals.weekday_hours_label')}</Label>
              <Input
                type="text"
                value={weekdayHours}
                onChange={(e) => onWeekdayHoursChange(e.target.value)}
                placeholder="2"
                className="bg-gray-800 border-gray-700 text-white text-xs h-8"
              />
              {validationErrors.weekdayHours && (
                <div className="text-xs text-red-400">{validationErrors.weekdayHours}</div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-xs">{t('goals.weekend_hours_label')}</Label>
              <Input
                type="text"
                value={weekendHours}
                onChange={(e) => onWeekendHoursChange(e.target.value)}
                placeholder="5"
                className="bg-gray-800 border-gray-700 text-white text-xs h-8"
              />
              {validationErrors.weekendHours && (
                <div className="text-xs text-red-400">{validationErrors.weekendHours}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 