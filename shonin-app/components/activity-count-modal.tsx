"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronLeft, ChevronRight, Play, Eye, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { SessionDetailModal } from "./session-detail-modal"
import { useScrollLock } from "@/lib/modal-scroll-lock"
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

  // モーダルが開いている間は背景スクロールを無効にする（SP対応強化）
  useScrollLock(isOpen)

  if (!isOpen) return null

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

  // 回数順で行動を取得
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
        activityId: activity.id,
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
    onClose()
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
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              回数順
            </CardTitle>
          </CardHeader>

          <CardContent ref={scrollContainerRef} className="overflow-y-auto h-[calc(400px-80px)] sm:max-h-[calc(90vh-200px)] sm:h-auto px-3 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {currentActivities.map((activity, index) => (
                <div
                  key={`${activity.id}-${currentPage}`}
                  onClick={isMobile ? () => {
                    // SPの場合のみカード全体をクリック可能にする
                    handleActivityDetailClick(activity)
                  } : undefined}
                  className={`flex items-center justify-between p-2 sm:p-3 md:p-4 bg-gray-800 rounded-lg transition-colors group ${isMobile ? 'cursor-pointer hover:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 font-mono text-xs sm:text-sm w-3 sm:w-4 md:w-6 text-right">
                        {startIndex + index + 1}
                      </span>
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 ${activity.color} rounded-full flex items-center justify-center text-base sm:text-lg md:text-xl`}>
                        {activity.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* SP: 縦並び, PC: 横並び */}
                      <div className="flex flex-col">
                        <h3 className="text-white font-semibold truncate text-base sm:text-lg mb-1">{activity.name}</h3>
                        <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-400">
                          <span className="font-medium text-green-400">{activity.sessionCount}回</span>
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
                          handleViewDetail(activity)
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        詳細
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivityClick(activity)
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        開始
                      </Button>
                    </div>
                    
                    {/* SPでは開始ボタンを右側に表示 */}
                    <div className="sm:hidden">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivityClick(activity)
                        }}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        開始
                      </Button>
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

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 sm:space-x-2 mt-3 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 px-3 sm:px-3"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-green-600 hover:bg-green-700 px-3 sm:px-3 text-xs sm:text-sm min-w-[32px]"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 px-3 sm:px-3 text-xs sm:text-sm min-w-[32px]"
                        }
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50 px-3 sm:px-3"
                >
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>

                <span className="text-xs sm:text-sm text-gray-400 ml-2 sm:ml-4 hidden sm:inline">
                  {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, activities.length)} / {activities.length}
                </span>
              </div>
            )}
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