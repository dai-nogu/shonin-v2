// カレンダーのUI変更

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/common/dialog"
import { Button } from "@/components/ui/common/button"
import { Calendar } from "lucide-react"
import { formatDuration } from "@/lib/format-duration"
import { useTimezone } from "@/contexts/timezone-context"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"
import type { CalendarSession } from "@/lib/calendar-utils"
import { useTranslations, useLocale } from 'next-intl'
import { formatDateForLocale } from '@/lib/i18n-utils'
import { X } from "lucide-react"

export type { CalendarSession }

interface CalendarCommonProps {
  completedSessions: CompletedSession[]
  initialDate?: Date
  CalendarComponent: React.ComponentType<any>
  viewMode: "month" | "week"
  onNavigate: (direction: "prev" | "next") => void
  onTodayClick: () => void
  onDateClick?: (date: any, sessions: CalendarSession[]) => void
  currentDate: Date
}

export function CalendarCommon({
  completedSessions,
  initialDate = new Date(),
  CalendarComponent,
  viewMode,
  onNavigate,
  onTodayClick,
  onDateClick,
  currentDate
}: CalendarCommonProps) {
  const router = useRouter()
  const { timezone } = useTimezone()
  const t = useTranslations()
  const locale = useLocale()
  const [selectedDateSessions, setSelectedDateSessions] = useState<CalendarSession[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string>("")
  const [isMobile, setIsMobile] = useState(false)
  
  // SP版用の下部表示状態
  const [showBottomPanel, setShowBottomPanel] = useState(false)
  const [bottomPanelDate, setBottomPanelDate] = useState<string>("")
  const [bottomPanelSessions, setBottomPanelSessions] = useState<CalendarSession[]>([])

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 内部で使用する日付クリック処理
  const handleInternalDateClick = (date: any, sessions: CalendarSession[]) => {
    setSelectedDateSessions(sessions)
    
    // 日付文字列のフォーマット（月と週で異なる）
    let dateStr: string
    if (viewMode === "month" && typeof date === "number") {
      // 月表示の場合
      const slashFormatDate = `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${date}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else if (viewMode === "week" && date instanceof Date) {
      // 週表示の場合
      const slashFormatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
      dateStr = formatDateForLocale(slashFormatDate, locale)
    } else {
      dateStr = "Invalid Date"
    }
    
    if (isMobile) {
      // SP版：下部パネルを表示
      setBottomPanelDate(dateStr)
      setBottomPanelSessions(sessions)
      setShowBottomPanel(true)
    } else if (viewMode === "week" ? sessions.length > 2 : true) {
      // PC版：週表示では3つ以上、月表示では常にモーダルを表示
      setModalDate(dateStr)
      setIsModalOpen(true)
    }
  }

  return (
    <div className="bg-gray-950 text-white">
      <div className="px-0">
        {/* 月/週切り替えボタン */}
        <div className="bg-gray-900 px-2 md:px-4 pt-6 pb-3">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => router.push("/calendar/month")}
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className={
                viewMode === "month"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              月表示
            </Button>
            <Button
              onClick={() => router.push("/calendar/week")}
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className={
                viewMode === "week"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <Calendar className="w-4 h-4 mr-1" />
              週表示
            </Button>
          </div>
        </div>

        {/* カレンダーコンポーネント */}
                 <CalendarComponent
           currentDate={currentDate}
           completedSessions={completedSessions}
           timezone={timezone}
           onNavigate={onNavigate}
           onTodayClick={onTodayClick}
           onDateClick={handleInternalDateClick}
         />
        
        {/* SP版用：下部パネル（通常のフロー内） */}
        {showBottomPanel && isMobile && (
          <div>
            {/* 日付部分 - 白い背景で区別 */}
            <div className="text-black px-2 md:px-4 py-1" style={{backgroundColor: '#e4e4e4'}}>
              <h3 className="text-lg font-medium">{bottomPanelDate}</h3>
            </div>
            
            {/* アクティビティ部分 - 既存の背景色 */}
            <div className="bg-gray-900 border-t border-gray-700">
              <div className="pb-2">
                <div>
                  {bottomPanelSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className={`flex items-center justify-between py-2 px-3 rounded-lg ${session.color} bg-opacity-20`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-white font-medium">{session.activity}</div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatDuration(session.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* セッション詳細モーダル（PC版） */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[90%] sm:max-w-[500px] bg-gray-900 border-gray-800">
                  <DialogHeader>
          <DialogTitle className="text-white">
            {t('calendar.activities_on_date', { date: formatDateForLocale(modalDate, locale) })}
          </DialogTitle>
        </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto">
            {selectedDateSessions.map((session) => (
              <div 
                key={session.id} 
                className={`p-3 rounded-lg ${session.color} bg-opacity-20 border border-opacity-30`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{session.activity}</span>
                </div>
                <div className="mt-1 text-gray-400 text-sm">
                  {formatDuration(session.duration)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-0"
            >
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

 