"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Eye, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { ModalPagination } from "@/components/ui/dashboard/modal-pagination"
import { useTranslations } from 'next-intl'

import { SessionDetailModal } from "./session-detail-modal"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import type { CompletedSession, SessionData } from "./time-tracker"

interface RecentSessionsModalProps {
  isOpen: boolean
  completedSessions: CompletedSession[]
  onClose: () => void
  onStartActivity?: (sessionData: SessionData) => void
  onViewDetail?: (session: CompletedSession) => void
}

interface SessionItem {
  id: string
  name: string
  duration: string
  date: string
  rating: number
  category: string
  icon: string
  color: string
  location?: string
  session: CompletedSession
}

const ITEMS_PER_PAGE = 10

export function RecentSessionsModal({ isOpen, completedSessions, onClose, onStartActivity, onViewDetail }: RecentSessionsModalProps) {
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // スクロール位置をリセットするためのref
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // モーダルが開いている間は背景スクロールを無効にする
  useScrollLock(isOpen)

  if (!isOpen) return null

  // アクティビティアイコンマッピング
  const activityIcons: Record<string, { icon: string; color: string; category: string }> = {
    "読書": { icon: "📚", color: "bg-blue-500", category: "学習" },
    "プログラミング": { icon: "💻", color: "bg-purple-500", category: "学習" },
    "運動": { icon: "🏃", color: "bg-red-500", category: "健康" },
    "音楽練習": { icon: "🎵", color: "bg-yellow-500", category: "趣味" },
    "英語学習": { icon: "🌍", color: "bg-green-500", category: "学習" },
    "瞑想": { icon: "🧘", color: "bg-indigo-500", category: "健康" },
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric"
    })
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}${t('time.minutes_ago')}`
    if (diffHours < 24) return `${diffHours}${t('time.hours_ago')}`
    if (diffDays === 1) return t('time.yesterday')
    if (diffDays < 7) return `${diffDays}${t('time.days_ago')}`
    return formatDate(date)
  }

  // 最新順でセッションを取得（最大100件）
  const getRecentSessions = (): SessionItem[] => {
    return completedSessions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 100) // 最大100件に制限
      .map(session => {
        const activityInfo = activityIcons[session.activityName] || {
          icon: session.activityIcon,
          color: session.activityColor,
          category: "その他"
        }

        return {
          id: session.id,
          name: session.activityName,
          duration: formatDuration(session.duration),
          date: formatRelativeTime(new Date(session.endTime)),
          rating: session.mood || 0,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: session.location,
          session
        }
      })
  }

  const sessions = getRecentSessions()
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentSessions = sessions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleActivityClick = (sessionItem: SessionItem) => {
    if (onStartActivity) {
      const sessionData: SessionData = {
        activityId: sessionItem.id,
        activityName: sessionItem.name,
        startTime: new Date(),
        location: sessionItem.location || "",
        notes: "",
        targetTime: sessionItem.session.targetTime,
        // 目標IDを保持
        goalId: sessionItem.session.goalId,
      }
      onStartActivity(sessionData)
    }
    onClose()
  }

  // SPでの詳細表示用のハンドラー
  const handleSessionDetailClick = (sessionItem: SessionItem) => {
    if (onViewDetail) {
      onViewDetail(sessionItem.session)
    } else {
      // フォールバック: 内部モーダル表示
      setSelectedSession(sessionItem.session)
      setShowDetailModal(true)
    }
  }

  const handleViewDetail = (sessionItem: SessionItem) => {
    if (onViewDetail) {
      onViewDetail(sessionItem.session)
    } else {
      // フォールバック: 内部モーダル表示
      setSelectedSession(sessionItem.session)
      setShowDetailModal(true)
    }
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSession(null)
  }

  const handleStartSimilar = (sessionData: any) => {
    if (onStartActivity) {
      onStartActivity(sessionData)
    }
    onClose()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // スクロール位置をリセット
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <Card 
          className="bg-gray-900 border-gray-800 w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto h-[400px] sm:max-h-[90vh] sm:h-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="relative pb-3 sm:pb-6">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            
                          <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('quick_start.latest')}
              </CardTitle>
          </CardHeader>

          <CardContent ref={scrollContainerRef} className="overflow-y-auto h-[calc(400px-80px)] sm:max-h-[calc(90vh-200px)] sm:h-auto px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="space-y-2 sm:space-y-3">
              {currentSessions.map((sessionItem, index) => (
                <div
                  key={`${sessionItem.id}-${currentPage}`}
                  onClick={() => {
                    // モーダル内では常に詳細表示（開始ボタンは別途stopPropagationで制御）
                    handleSessionDetailClick(sessionItem)
                  }}
                  className="flex items-center justify-between p-2 sm:p-3 md:p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 font-mono text-xs sm:text-sm w-3 sm:w-4 md:w-6 text-right">
                        {startIndex + index + 1}
                      </span>
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${sessionItem.color} rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl`}>
                        {sessionItem.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* 回数順モーダルと同じレイアウトに統一 */}
                      <div className="flex flex-col">
                        <h3 className="text-white font-semibold truncate text-base sm:text-lg mb-1">{sessionItem.name}</h3>
                        <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                          <span className="text-blue-400">{sessionItem.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <div className="hidden sm:flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(sessionItem)
                        }}
                                              >
                          <Eye className="w-3 h-3 mr-1" />
                          {t('common.details')}
                        </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivityClick(sessionItem)
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {t('common.start')}
                      </Button>
                    </div>
                    
                    {/* SPでは開始ボタンを右側に表示 */}
                    <div className="sm:hidden">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivityClick(sessionItem)
                        }}
                                              >
                          <Play className="w-3 h-3 mr-1" />
                          {t('common.start')}
                        </Button>
                    </div>
                  </div>
                </div>
              ))}

              {currentSessions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">セッションがありません</p>
                </div>
              )}
            </div>

            <ModalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={sessions.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </CardContent>
        </Card>
      </div>

      <SessionDetailModal
        isOpen={showDetailModal}
        session={selectedSession}
        onClose={handleCloseDetail}
        onStartSimilar={handleStartSimilar}
      />
    </>
  )
} 