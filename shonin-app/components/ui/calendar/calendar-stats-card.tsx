"use client"

import { memo } from "react"
import { BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/common/card"
import { formatDuration } from "@/lib/format-duration"
import { useTranslations } from 'next-intl'

interface CalendarStatsCardProps {
  value: number
  label: string
  color?: 'emerald' | 'brown'
  noRecordsMessage?: string
}

export const CalendarStatsCard = memo(function CalendarStatsCard({
  value,
  label,
  color = 'emerald',
  noRecordsMessage
}: CalendarStatsCardProps) {
  const colorClass = color === 'emerald' ? 'text-emerald-500' : 'text-[#96514d]'

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-xl shadow-lg">
      <CardContent className="p-3 md:p-6 text-center">
        {value === 0 ? (
          <>
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-full bg-gray-800/50">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
              </div>
            </div>
            <div className="text-xs md:text-sm text-gray-500 font-medium">
              {noRecordsMessage}
            </div>
          </>
        ) : (
          <>
            <div className={`text-2xl md:text-3xl font-bold ${colorClass} mb-1`}>
              {formatDuration(value)}
            </div>
            <div className="text-xs md:text-sm text-gray-400 font-medium tracking-wide">
              {label}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

