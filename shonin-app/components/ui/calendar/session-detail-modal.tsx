"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/common/dialog"
import { Button } from "@/components/ui/common/button"
import { formatDuration } from "@/lib/format-duration"
import { useTranslations, useLocale } from 'next-intl'
import { formatDateForLocale } from '@/lib/i18n-utils'
import type { CalendarSession } from "@/lib/calendar-utils"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import { SessionDetailModal as DashboardSessionDetailModal } from "@/components/ui/dashboard/session-detail-modal"

interface SessionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  sessions: CalendarSession[]
  completedSessions?: CompletedSession[]
}

export function SessionDetailModal({ 
  isOpen, 
  onClose, 
  date, 
  sessions,
  completedSessions = []
}: SessionDetailModalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // セッションカードをクリックした時の処理
  const handleSessionClick = (calendarSession: CalendarSession) => {
    // completedSessionsから該当するセッションを探す
    const matchingSession = completedSessions.find(
      cs => cs.activityName === calendarSession.activity && 
           cs.id === calendarSession.id
    )
    
    // IDで見つからない場合は、同じ日付・アクティビティ名で探す
    const sessionToShow = matchingSession || completedSessions.find(
      cs => cs.activityName === calendarSession.activity
    )
    
    if (sessionToShow) {
      // 元のモーダルを閉じてから詳細モーダルを開く
      onClose()
      setSelectedSession(sessionToShow)
      setShowDetailModal(true)
    }
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSession(null)
  }
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90%] sm:max-w-[500px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {t('calendar.activities_on_date', { date: formatDateForLocale(date, locale) })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className={`p-4 rounded-xl shadow-sm ${session.color} bg-opacity-10 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-opacity-20 hover:scale-[1.01] active:scale-[0.98]`}
                onClick={() => handleSessionClick(session)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-semibold text-lg">{session.activity}</span>
                  </div>
                  <div className="text-white/90 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                    {formatDuration(session.duration)}
                  </div>
                </div>
                <div className="text-gray-400 text-xs flex items-center">
                  Click to view details
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white border-0"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* セッション詳細モーダル（開始ボタンなし） */}
      <DashboardSessionDetailModal
        isOpen={showDetailModal}
        session={selectedSession}
        onClose={handleCloseDetail}
      />
    </>
  )
} 