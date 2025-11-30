"use client"

import { Calculator } from "lucide-react"
import { Card, CardContent } from "@/components/ui/common/card"
import { useTranslations } from 'next-intl'

interface GoalCalculationDisplayProps {
  weeklyHours: number
  monthlyHours: number
  totalHours: number
}

export function GoalCalculationDisplay({ 
  weeklyHours, 
  monthlyHours, 
  totalHours 
}: GoalCalculationDisplayProps) {
  const t = useTranslations()
  
  if (totalHours <= 0) return null

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-start md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-400">{t('goals.weekly_calculation')}: </span>
          <span className="text-white">{weeklyHours}{t('goals.hours_unit')}</span>
        </div>
        <div>
          <span className="text-gray-400">{t('goals.monthly_calculation')}: </span>
          <span className="text-white">{monthlyHours}{t('goals.hours_unit')}</span>
        </div>
        <div>
          <span className="text-gray-400">{t('goals.total_goal')}: </span>
          <span className="text-white font-medium">{totalHours}{t('goals.hours_unit')}</span>
        </div>
      </div>
    </div>
  )
} 