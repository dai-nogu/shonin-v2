"use client"

import { memo } from "react"
import { Button } from "@/components/ui/common/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/common/card"
import { useTranslations } from 'next-intl'

interface CalendarHeaderProps {
  title?: string
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  todayLabel?: 'today' | 'this_week'
}

export const CalendarHeader = memo(function CalendarHeader({
  title,
  onNavigate,
  onTodayClick,
  todayLabel = 'today'
}: CalendarHeaderProps) {
  const t = useTranslations('calendar')

  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        {title && <CardTitle className="text-white">{title}</CardTitle>}
        {!title && <div />}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onTodayClick}
            className="text-gray-300 hover:bg-white/10"
          >
            {t(todayLabel)}
          </Button>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("prev")}
              className="text-gray-300 hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("next")}
              className="text-gray-300 hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </CardHeader>
  )
})

