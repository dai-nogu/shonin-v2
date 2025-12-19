"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, Clock, Eye, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModalPagination } from "@/components/ui/dashboard/modal-pagination"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"

import { SessionDetailModal } from "./session-detail-modal"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import { useSessions } from "@/contexts/sessions-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import type { CompletedSession, SessionData } from "./time-tracker"

interface RecentSessionsModalProps {
  isOpen: boolean
  completedSessions: CompletedSession[]
  onClose: () => void
  onStartActivity?: (sessionData: SessionData) => void
  onViewDetail?: (session: CompletedSession) => void
  filterMode?: 'all' | 'yesterday'  // フィルタモード
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
  goalId?: string
  goalTitle?: string
  session: CompletedSession
}

const ITEMS_PER_PAGE = 10

export function RecentSessionsModal({ isOpen, completedSessions, onClose, onStartActivity, onViewDetail, filterMode = 'all' }: RecentSessionsModalProps) {
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // スクロール位置をリセットするためのref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()

  // アニメーション状態（早期returnの前に配置する必要がある）
  const [isAnimating, setIsAnimating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // マウント時にアニメーション開始
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      // 次のフレームでアニメーション開始
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
    }
  }, [isOpen])

  // ふわっと閉じるハンドラー
  const handleClose = () => {
    setIsAnimating(false)
    setIsClosing(true)
    // アニメーション完了後に実際に閉じる
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 300)
  }

  // モーダルが開いている間は背景スクロールを無効にする
  useScrollLock(isOpen || isClosing)

  if (!isOpen && !isClosing) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}\u2009h ${minutes}\u2009min`
    }
    return `${minutes}\u2009min`
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
    // filterModeに応じてフィルタリング
    let filteredSessions = completedSessions
    
    if (filterMode === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      filteredSessions = completedSessions.filter(session => {
        const sessionDate = new Date(session.endTime)
        return sessionDate.toDateString() === yesterday.toDateString()
      })
    }
    
    return filteredSessions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 100) // 最大100件に制限
      .map(session => {
        const goalInfo = session.goalId ? getGoal(session.goalId) : null

        return {
          id: session.id,
          name: session.activityName,
          duration: formatDuration(session.duration),
          date: formatRelativeTime(new Date(session.endTime)),
          rating: session.mood || 0,
          category: "その他",
          icon: session.activityIcon || session.activityName.charAt(0),
          color: session.activityColor || "bg-gray-500",
          location: session.location,
          goalId: session.goalId,
          goalTitle: goalInfo?.title,
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
        activityId: sessionItem.session.activityId,
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
    handleClose()
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
        className={cn(
          "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      >
        <Card 
          className={cn(
            "bg-gray-900 border-gray-800 w-full max-w-md sm:max-w-lg md:max-w-2xl mx-auto h-[400px] sm:max-h-[90vh] sm:h-auto overflow-hidden transition-all duration-300 ease-out",
            isAnimating ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="relative pb-3 sm:pb-6">
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
            
                          <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {filterMode === 'yesterday' ? t('quick_start.yesterday') : t('quick_start.latest')}
              </CardTitle>
          </CardHeader>

          <CardContent ref={scrollContainerRef} className="overflow-y-auto h-[calc(400px-80px)] sm:max-h-[calc(90vh-200px)] sm:h-auto px-3 sm:px-6 pt-2 pb-3 sm:pb-6">
            <div className="space-y-3">
              {currentSessions.map((sessionItem, index) => (
                <div
                  key={`${sessionItem.id}-${currentPage}`}
                  onClick={() => {
                    if (isMobile) {
                      handleSessionDetailClick(sessionItem)
                    }
                  }}
                  className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border border-white/10 transition-all duration-300 group hover:border-white/20 hover:shadow-lg hover:shadow-purple-900/10 hover:-translate-y-0.5 ${isMobile ? 'cursor-pointer' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* 左側：アイコン + 情報 */}
                  <div className="flex items-center space-x-4 flex-1 min-w-0 relative z-10">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${sessionItem.color} text-xl`}>
                      {sessionItem.icon || sessionItem.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-bold truncate text-base lg:text-lg drop-shadow-md">
                          {sessionItem.name}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-3 text-xs lg:text-sm text-gray-300">
                        <div className="flex items-center bg-white/10 border border-white/5 px-2.5 py-0.5 rounded-full">
                          <span className="text-emerald-400 font-medium">{sessionItem.date}</span>
                        </div>
                        {sessionItem.goalTitle && (
                          <div className="hidden sm:flex items-center text-xs text-purple-200 bg-purple-500/20 border border-purple-500/20 px-2.5 py-0.5 rounded-full truncate max-w-[150px]">
                            <Target className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate font-medium">{sessionItem.goalTitle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center space-x-2 relative z-10 pl-4">
                    {/* SP版: 詳細ボタン + 開始ボタン */}
                    {isMobile ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetail(sessionItem)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isSessionActive ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <span className="inline-block cursor-not-allowed">
                                  <Button
                                    size="icon"
                                    disabled
                                    className="h-10 w-10 rounded-full bg-gray-700 text-gray-500 opacity-50 pointer-events-none"
                                  >
                                    <Play className="w-4 h-4 fill-current" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="end">
                                <p className="text-xs">{t('common.recording_in_progress')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button
                            size="icon"
                            className="h-10 w-10 rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:scale-110 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivityClick(sessionItem)
                            }}
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </Button>
                        )}
                      </>
                    ) : (
                      // PC版: 詳細ボタン + 開始ボタン (テキスト付き)
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-400 hover:text-white hover:bg-white/10 border border-white/30 hover:border-white/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewDetail(sessionItem)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          {t('common.details')}
                        </Button>
                        {isSessionActive ? (
                          <TooltipProvider>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <span className="inline-block cursor-not-allowed">
                                  <Button
                                    size="sm"
                                    disabled
                                    className="bg-gray-700 text-gray-500 opacity-50 pointer-events-none px-4"
                                  >
                                    <Play className="w-3 h-3 mr-1.5 fill-current" />
                                    {t('common.start')}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="end">
                                <p className="text-xs">{t('common.recording_in_progress')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button
                            size="sm"
                            className="px-5 bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleActivityClick(sessionItem)
                            }}
                          >
                            <Play className="w-3 h-3 mr-1.5 fill-current" />
                            {t('common.start')}
                          </Button>
                        )}
                      </>
                    )}
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