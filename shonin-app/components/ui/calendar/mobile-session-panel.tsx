"use client"

import { formatDuration } from "@/lib/format-duration"
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
  if (!isVisible) return null

  return (
    <div>
      {/* 日付部分 - 白い背景で区別 */}
      <div className="text-black px-2 md:px-4 py-1" style={{backgroundColor: '#e4e4e4'}}>
        <h3 className="text-lg font-medium">{date}</h3>
      </div>
      
      {/* アクティビティ部分 - 既存の背景色 */}
      <div className="bg-gray-900 border-t border-gray-700">
        <div className="pb-2">
          <div>
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between py-2 px-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${session.color}`} />
                  <div className="text-white font-medium">{session.activity}</div>
                </div>
                <div className="text-gray-400 text-sm">
                  {formatDuration(session.duration)}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center text-gray-400 py-4">
                この日はアクティビティがありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 