"use client"

import { useState } from "react"
import { Play, Calendar, Clock, Star, MapPin, BarChart3, History, CalendarDays, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmStartModal } from "./confirm-start-modal"
import { SessionDetailModal } from "./session-detail-modal"
import type { SessionData, CompletedSession } from "./time-tracker"

interface QuickStartActivity {
  id: string
  name: string
  duration: string
  date: string
  tags: string[]
  rating: number
  category: string
  icon: string
  color: string
  location?: string
  totalTime?: number // 総時間（ソート用）
  sessionCount?: number // セッション数
}

interface QuickStartProps {
  completedSessions: CompletedSession[]
  onStartActivity?: (sessionData: SessionData) => void
}

export function QuickStart({ completedSessions, onStartActivity }: QuickStartProps) {
  const [selectedActivity, setSelectedActivity] = useState<QuickStartActivity | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState("most-recorded")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)

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
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "今日"
    if (diffDays === 1) return "昨日"
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  // データの記録が多い順（総時間ベース）
  const getMostRecordedActivities = (): QuickStartActivity[] => {
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
      .sort((a, b) => b[1].totalTime - a[1].totalTime)
      .slice(0, 3)
      .map(([activityName, stats]) => {
        const activityInfo = activityIcons[activityName] || {
          icon: "📝",
          color: "bg-gray-500",
          category: "その他"
        }

        return {
          id: stats.latestSession.id,
          name: activityName,
          duration: formatDuration(stats.totalTime),
          date: `${stats.sessionCount}回`,
          tags: stats.latestSession.tags,
          rating: stats.latestSession.mood,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: stats.latestSession.location,
          totalTime: stats.totalTime,
          sessionCount: stats.sessionCount
        }
      })
  }

  // 最新のアクティビティ
  const getRecentActivities = (): QuickStartActivity[] => {
    const activityMap = new Map<string, CompletedSession>()
    
    completedSessions.forEach(session => {
      const existing = activityMap.get(session.activityName)
      if (!existing || new Date(session.endTime) > new Date(existing.endTime)) {
        activityMap.set(session.activityName, session)
      }
    })

    return Array.from(activityMap.values())
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 3)
      .map(session => {
        const activityInfo = activityIcons[session.activityName] || {
          icon: "📝",
          color: "bg-gray-500",
          category: "その他"
        }

        return {
          id: session.id,
          name: session.activityName,
          duration: formatDuration(session.duration),
          date: formatDate(new Date(session.endTime)),
          tags: session.tags,
          rating: session.mood,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: session.location
        }
      })
  }

  // 昨日のアクティビティ
  const getYesterdayActivities = (): QuickStartActivity[] => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const yesterdaySessions = completedSessions.filter(session => {
      const sessionDate = new Date(session.endTime)
      return sessionDate.toDateString() === yesterday.toDateString()
    })

    return yesterdaySessions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 3)
      .map(session => {
        const activityInfo = activityIcons[session.activityName] || {
          icon: "📝",
          color: "bg-gray-500",
          category: "その他"
        }

        return {
          id: session.id,
          name: session.activityName,
          duration: formatDuration(session.duration),
          date: session.endTime.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          tags: session.tags,
          rating: session.mood,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: session.location
        }
      })
  }

  const handleActivityClick = (activity: QuickStartActivity) => {
    setSelectedActivity(activity)
    setShowModal(true)
  }

  const handleConfirmStart = () => {
    if (selectedActivity && onStartActivity) {
      const sessionData: SessionData = {
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        startTime: new Date(),
        tags: [],
        location: selectedActivity.location || "",
        notes: "",
      }
      onStartActivity(sessionData)
    }
    setShowModal(false)
    setSelectedActivity(null)
  }

  const handleCancel = () => {
    setShowModal(false)
    setSelectedActivity(null)
  }

  const handleViewDetail = (activity: QuickStartActivity) => {
    // アクティビティIDに対応するセッションを見つける
    const session = completedSessions.find(s => s.id === activity.id)
    if (session) {
      setSelectedSession(session)
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
  }

  const renderActivityList = (activities: QuickStartActivity[], emptyMessage: string) => {
    if (activities.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={`${activity.id}-${activeTab}`}
            onClick={() => handleActivityClick(activity)}
            className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors group"
          >
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-lg`}>
                {activity.icon}
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
                    <Clock className="w-3 h-3" />
                    <span>{activity.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {activeTab === "most-recorded" ? (
                      <>
                        <BarChart3 className="w-3 h-3" />
                        <span>{activity.date}</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>{activity.date}</span>
                      </>
                    )}
                  </div>
                  {activity.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${
                      star <= activity.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (completedSessions.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Play className="w-5 h-5 mr-2" />
            クイックスタート
          </CardTitle>
          <p className="text-gray-400 text-sm">最近のアクティビティから素早く開始</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">まだアクティビティがありません</p>
            <p className="text-gray-500 text-sm mt-2">最初のセッションを完了すると、ここに表示されます</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Play className="w-5 h-5 mr-2" />
            クイックスタート
          </CardTitle>
          <p className="text-gray-400 text-sm">最近のアクティビティから素早く開始</p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger 
                value="most-recorded" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                記録順
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <History className="w-4 h-4 mr-1" />
                最新
              </TabsTrigger>
              <TabsTrigger 
                value="yesterday" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <CalendarDays className="w-4 h-4 mr-1" />
                昨日
              </TabsTrigger>
            </TabsList>

            <TabsContent value="most-recorded" className="mt-4">
              {renderActivityList(
                getMostRecordedActivities(),
                "まだ十分なデータがありません"
              )}
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              {renderActivityList(
                getRecentActivities(),
                "最近のアクティビティがありません"
              )}
            </TabsContent>

            <TabsContent value="yesterday" className="mt-4">
              {renderActivityList(
                getYesterdayActivities(),
                "昨日のアクティビティがありません"
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmStartModal
        isOpen={showModal}
        activity={selectedActivity}
        onConfirm={handleConfirmStart}
        onCancel={handleCancel}
        showTags={false}
      />

      <SessionDetailModal
        isOpen={showDetailModal}
        session={selectedSession}
        onClose={handleCloseDetail}
        onStartSimilar={handleStartSimilar}
      />
    </>
  )
}
