"use client"

import { X } from "lucide-react"
import { formatDuration } from "@/lib/format-duration"
import { useTranslations } from 'next-intl'
import type { CalendarSession } from "@/lib/calendar-utils"

interface MobileSessionPanelProps {
  isVisible: boolean
  date: string
  sessions: CalendarSession[]
}

export function MobileSessionPanel({ 
  isVisible, 
  date, 
  sessions 
}: MobileSessionPanelProps) {
  const t = useTranslations()
  
  if (!isVisible) return null

  return (
    <div>
      {/* 日付部分 */}
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 sticky top-0 z-10">
        <h3 className="text-lg font-bold text-gray-900">{date}</h3>
      </div>
      
      {/* アクティビティ部分 */}
      <div className="bg-gray-950 p-2">
        <div className="space-y-2">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className={`flex items-center justify-between py-3 px-4 rounded-xl shadow-sm ${session.color} bg-opacity-20 border-l-4 border-white/20 backdrop-blur-sm`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-white font-medium text-base">{session.activity}</div>
              </div>
              <div className="text-white/90 font-mono text-sm bg-black/20 px-2 py-1 rounded">
                {formatDuration(session.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 