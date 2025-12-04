"use client"

import { useState, useEffect, useRef } from "react"
import { X, Play, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModalPagination } from "@/components/ui/dashboard/modal-pagination"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"

import { SessionDetailModal } from "./session-detail-modal"
import { useScrollLock } from "@/lib/modal-scroll-lock"
import { useSessions } from "@/contexts/sessions-context"
import type { CompletedSession, SessionData } from "./time-tracker"

interface ActivityCountModalProps {
  isOpen: boolean
  completedSessions: CompletedSession[]
  onClose: () => void
  onStartActivity?: (sessionData: SessionData) => void
  onViewDetail?: (session: CompletedSession) => void
}

interface ActivityItem {
  id: string
  name: string
  sessionCount: number
  totalTime: number
  category: string
  icon: string
  color: string
  latestSession: CompletedSession
}

const ITEMS_PER_PAGE = 10

export function ActivityCountModal({ isOpen, completedSessions, onClose, onStartActivity, onViewDetail }: ActivityCountModalProps) {
  const t = useTranslations()
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  // スクロール位置をリセットするためのref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()

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

  // モーダルが開いている間は背景スクロールを無効にする（SP対応強化）
  useScrollLock(isOpen || isClosing)

  if (!isOpen && !isClosing) return null

  // 行動アイコンマッピング
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
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 回数順で行動を取得（最大100活動）
  const getActivityByCount = (): ActivityItem[] => {
    const activityStats = new Map<string, { totalTime: number; sessionCount: number; latestSession: CompletedSession }>()
    
    completedSessions.forEach(session => {
      const existing = activityStats.get(session.activityName)
      if (existing) {
        existing.totalTime += session.duration
        existing.sessionCount += 1
        if (new Date(session.endTime) > new Date(existing.latestSession.endTime)) {
          existing.latestSession = session
        }
      } else {
        activityStats.set(session.activityName, {
          totalTime: session.duration,
          sessionCount: 1,
          latestSession: session
        })
      }
    })

    return Array.from(activityStats.entries())
      .sort((a, b) => b[1].sessionCount - a[1].sessionCount)
      .slice(0, 100) // 最大100活動に制限
      .map(([activityName, stats]) => {
        const activityInfo = activityIcons[activityName] || {
          icon: stats.latestSession.activityIcon,
          color: stats.latestSession.activityColor,
          category: "その他"
        }

        return {
          id: stats.latestSession.id,
          name: activityName,
          sessionCount: stats.sessionCount,
          totalTime: stats.totalTime,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          latestSession: stats.latestSession
        }
      })
  }

  const activities = getActivityByCount()
  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleActivityClick = (activity: ActivityItem) => {
    if (onStartActivity) {
      const sessionData: SessionData = {
        activityId: activity.latestSession.activityId,
        activityName: activity.name,
        startTime: new Date(),
        location: activity.latestSession.location || "",
        notes: "",
        targetTime: activity.latestSession.targetTime,
        // 目標IDを保持
        goalId: activity.latestSession.goalId,
      }
      onStartActivity(sessionData)
    }
    handleClose()
  }

  // SPでの詳細表示用のハンドラー
  const handleActivityDetailClick = (activity: ActivityItem) => {
    if (onViewDetail) {
      onViewDetail(activity.latestSession)
    } else {
      // フォールバック: 内部モーダル表示
      setSelectedSession(activity.latestSession)
      setShowDetailModal(true)
    }
  }

  const handleViewDetail = (activity: ActivityItem) => {
    if (onViewDetail) {
      onViewDetail(activity.latestSession)
    } else {
      // フォールバック: 内部モーダル表示
      setSelectedSession(activity.latestSession)
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
    handleClose()
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
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <CardTitle className="text-white flex items-center text-lg sm:text-xl">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('quick_start.most_recorded')}
            </CardTitle>
          </CardHeader>

          <CardContent ref={scrollContainerRef} className="overflow-y-auto h-[calc(400px-80px)] sm:max-h-[calc(90vh-200px)] sm:h-auto px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid gap-3">
              {currentActivities.map((activity, index) => (
                <div
                  key={`${activity.id}-${currentPage}`}
                  onClick={() => handleActivityDetailClick(activity)}
                  className={`p-4 rounded-xl shadow-sm ${activity.color} bg-opacity-10 border border-white/10 cursor-pointer transition-all duration-200 hover:bg-opacity-20 hover:scale-[1.01] hover:-translate-y-0.5`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-white font-semibold text-lg truncate">{activity.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="text-white/90 font-mono text-sm bg-white/10 px-2 py-1 rounded">
                        {activity.sessionCount}{t('common.times')}
                      </div>
                      {/* 開始ボタン */}
                      {isSessionActive ? (
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <span className="inline-block cursor-not-allowed">
                                <Button
                                  size="sm"
                                  disabled
                                  className="bg-[#1eb055] opacity-50 pointer-events-none"
                                >
                                  <Play className="w-3 h-3 mr-1" />
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
                          className="bg-[#1eb055] hover:bg-[#1a9649] active:scale-95 active:bg-[#158a3d] transition-all duration-150"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleActivityClick(activity)
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {t('common.start')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {currentActivities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400">行動がありません</p>
                </div>
              )}
            </div>

            <ModalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={activities.length}
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