"use client"

import { useState, useEffect } from "react"
import { X, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { cn } from "@/lib/utils"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import { useTranslations } from 'next-intl'
import { SessionDetailModal } from "@/components/ui/dashboard/session-detail-modal"
import type { CalendarSession } from "@/lib/calendar-utils"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface DateSessionsModalProps {
  isOpen: boolean
  onClose: () => void
  date: string
  sessions: CalendarSession[]
  completedSessions: CompletedSession[]
}

export function DateSessionsModal({ 
  isOpen, 
  onClose, 
  date, 
  sessions,
  completedSessions
}: DateSessionsModalProps) {
  const t = useTranslations()
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)

  // マウント時にアニメーション開始
  useEffect(() => {
    if (isOpen && !showDetailModal) {
      setIsClosing(false)
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else if (!isOpen) {
      setIsAnimating(false)
    }
  }, [isOpen, showDetailModal])

  // ふわっと閉じるハンドラー
  const handleClose = () => {
    setIsAnimating(false)
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // 詳細モーダルを開く（親モーダルは非表示に）
  const handleViewDetail = (session: CalendarSession) => {
    const fullSession = completedSessions.find(s => s.id === session.id)
    if (fullSession) {
      setSelectedSession(fullSession)
      setIsAnimating(false)
      setShowDetailModal(true)
    }
  }

  // 詳細モーダルを閉じる（全部閉じる）
  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSession(null)
    onClose()
  }

  // モーダルが開いている間は背景スクロールを無効にする
  useScrollLock(isOpen || isClosing || showDetailModal)

  if (!isOpen && !isClosing && !showDetailModal) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <>
      {/* 親モーダル（詳細モーダル表示中は非表示） */}
      {!showDetailModal && (
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300",
            isAnimating ? "opacity-100" : "opacity-0"
          )}
          onClick={handleClose}
        >
          <Card 
            className={cn(
              "bg-gray-900 border-gray-800 w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto max-h-[90vh] overflow-hidden transition-all duration-300 ease-out",
              isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
            )}
            onClick={(e) => e.stopPropagation()}
          >
          <CardHeader className="relative pb-4">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <CardTitle className="text-white text-lg sm:text-xl">
              {date}
            </CardTitle>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-100px)] px-3 sm:px-6 pt-2 pb-4 sm:pb-6">
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className="relative overflow-visible flex items-center justify-between p-4 rounded-xl border border-white/10 transition-all duration-300 group hover:border-white/20 hover:shadow-lg hover:shadow-purple-900/10 hover:-translate-y-0.5 cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleViewDetail(session)}
                >
                  {/* 左側：アイコン + 情報 */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0 relative z-10">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${session.color} text-xl`}>
                      {session.icon || session.activity.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate text-base lg:text-lg tracking-tight drop-shadow-md">
                        {session.activity}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs lg:text-sm text-gray-300 mt-1">
                        <div className="flex items-center bg-white/10 border border-white/5 px-2.5 py-0.5 rounded-full">
                          <span className="text-emerald-400 font-medium">{formatDuration(session.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 詳細ボタン */}
                  <div className="flex items-center relative z-10 pl-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/10 border border-white/30 hover:border-white/50"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetail(session)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      {t('common.details')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* セッション詳細モーダル */}
      <SessionDetailModal
        isOpen={showDetailModal}
        session={selectedSession}
        onClose={handleCloseDetail}
      />
    </>
  )
}
