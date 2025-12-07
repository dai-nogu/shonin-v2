"use client"

import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/common/button"
import { Calendar } from "lucide-react"
import { useTranslations } from 'next-intl'

interface CalendarViewToggleProps {
  viewMode: "month" | "week"
}

export function CalendarViewToggle({ viewMode }: CalendarViewToggleProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'

  return (
    <div className="bg-gray-950 px-2 md:px-4 pt-6 pb-3">
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => router.push(`/${locale}/calendar/month`)}
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          className={
            viewMode === "month"
              ? "bg-emerald-700 text-white"
              : "bg-transparent border-gray-600 text-gray-300 hover:bg-white/10"
          }
        >
          <Calendar className="w-4 h-4 mr-1" />
          {t('calendar.month_view')}
        </Button>
        <Button
          onClick={() => router.push(`/${locale}/calendar/week`)}
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          className={
            viewMode === "week"
              ? "bg-emerald-700 text-white"
              : "bg-transparent border-gray-600 text-gray-300 hover:bg-white/10"
          }
        >
          <Calendar className="w-4 h-4 mr-1" />
          {t('calendar.week_view')}
        </Button>
      </div>
    </div>
  )
} 