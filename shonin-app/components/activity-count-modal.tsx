"use client"

import { useState, useEffect } from "react"
import { X, ChevronLeft, ChevronRight, Play, Eye, Clock, BarChart3, Star, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionDetailModal } from "./session-detail-modal"
import type { CompletedSession, SessionData } from "./time-tracker"

interface ActivityCountModalProps {
  isOpen: boolean
  completedSessions: CompletedSession[]
  onClose: () => void
  onStartActivity?: (sessionData: SessionData) => void
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

export function ActivityCountModal({ isOpen, completedSessions, onClose, onStartActivity }: ActivityCountModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

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
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // 回数順でアクティビティを取得
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
        targetTime: activity.latestSession.targetTime
      }
      onStartActivity(sessionData)
    }
    onClose()
  }

  const handleViewDetail = (activity: ActivityItem) => {
    setSelectedSession(activity.latestSession)
    setShowDetailModal(true)
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
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <Card 
          className="bg-gray-900 border-gray-800 max-w-4xl w-full mx-auto max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <CardHeader className="relative">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              アクティビティ別実行回数
            </CardTitle>
            <p className="text-gray-400 text-sm">実行回数が多い順に表示</p>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <div className="space-y-3">
              {currentActivities.map((activity, index) => (
                <div
                  key={`${activity.id}-${currentPage}`}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 font-mono text-sm w-6 text-right">
                        {startIndex + index + 1}
                      </span>
                      <div className={`w-12 h-12 ${activity.color} rounded-full flex items-center justify-center text-xl`}>
                        {activity.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-medium truncate">{activity.name}</h3>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                          {activity.category}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="w-3 h-3" />
                          <span className="font-medium text-green-400">{activity.sessionCount}回</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>合計 {formatDuration(activity.totalTime)}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
                          <span>最新: {formatDate(new Date(activity.latestSession.endTime))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= (activity.latestSession.mood || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                        onClick={() => handleViewDetail(activity)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        詳細
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleActivityClick(activity)}
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
                  <p className="text-gray-400">アクティビティがありません</p>
                </div>
              )}
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center space-x-1">
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
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
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
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <span className="text-sm text-gray-400 ml-4">
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