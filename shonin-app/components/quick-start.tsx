"use client"

import { useState, useEffect } from "react"
import { Play, Calendar, Clock, Star, MapPin, BarChart3, History, CalendarDays, Eye, MoreHorizontal, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmStartModal } from "./confirm-start-modal"
import { SessionDetailModal } from "./session-detail-modal"
import { ActivityCountModal } from "./activity-count-modal"
import { RecentSessionsModal } from "./recent-sessions-modal"
import { useActivities } from "@/contexts/activities-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import type { SessionData, CompletedSession } from "./time-tracker"

interface QuickStartActivity {
  id: string
  name: string
  duration: string
  date: string
  rating: number
  category: string
  icon: string
  color: string
  location?: string
  totalTime?: number // 総時間（ソート用）
  sessionCount?: number // セッション数
  goalId?: string // 目標ID
  goalTitle?: string // 目標タイトル
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
  const [showActivityCountModal, setShowActivityCountModal] = useState(false)
  const [showRecentSessionsModal, setShowRecentSessionsModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [previousModal, setPreviousModal] = useState<'activity-count' | 'recent-sessions' | null>(null)
  
  // 行動管理フック
  const { activities, addActivity } = useActivities()
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()

  // モバイル判定（タブレットは除外、スマートフォンのみ）
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      const newIsMobile = width < 768
      setIsMobile(newIsMobile)
    }
    
    // 初回実行
    checkMobile()
    
    // リサイズイベント
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // セッションから色・アイコン情報を取得、なければ従来のマッピングを使用
  const getActivityStyle = (session: CompletedSession) => {
    // セッションに色・アイコンが保存されている場合はそれを使用
    if (session.activityColor && session.activityIcon) {
      return { 
        icon: session.activityIcon, 
        color: session.activityColor,
        category: getCategoryByName(session.activityName)
      }
    }

    // 色だけが保存されている場合
    if (session.activityColor) {
      return {
        icon: session.activityIcon || "",
        color: session.activityColor,
        category: getCategoryByName(session.activityName)
      }
    }

    // 保存されていない場合は従来のマッピングを使用
    const activityIcons: Record<string, { icon: string; color: string; category: string }> = {
      "読書": { icon: "📚", color: "bg-blue-500", category: "学習" },
      "プログラミング": { icon: "💻", color: "bg-purple-500", category: "学習" },
      "運動": { icon: "🏃", color: "bg-red-500", category: "健康" },
      "音楽練習": { icon: "🎵", color: "bg-yellow-500", category: "趣味" },
      "英語学習": { icon: "🌍", color: "bg-green-500", category: "学習" },
      "瞑想": { icon: "🧘", color: "bg-indigo-500", category: "健康" },
    }

    return activityIcons[session.activityName] || {
      icon: "",
      color: "bg-gray-500",
      category: ""
    }
  }

  // 行動名からカテゴリを推測
  const getCategoryByName = (activityName: string) => {
    const name = activityName.toLowerCase()
    if (name.includes('読書') || name.includes('プログラミング') || name.includes('英語') || name.includes('勉強') || name.includes('学習')) {
      return "学習"
    } else if (name.includes('運動') || name.includes('瞑想') || name.includes('健康')) {
      return "健康"
    } else if (name.includes('音楽') || name.includes('趣味')) {
      return "趣味"
    }
    return ""
  }

  const formatDuration = (seconds: number, forMobile: boolean = false) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return forMobile ? `${hours}h ${minutes}m` : `${hours}h ${minutes}m`
    }
    return forMobile ? `${minutes}m` : `${minutes}m`
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 60) return `${diffMinutes}分前`
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffDays === 1) return "昨日"
    if (diffDays < 7) return `${diffDays}日前`
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  // 行動別（実行回数が多い順）
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
      .sort((a, b) => b[1].sessionCount - a[1].sessionCount) // 実行回数順に変更
      .slice(0, 3)
      .map(([activityName, stats]) => {
        const activityInfo = getActivityStyle(stats.latestSession)
        const goalInfo = stats.latestSession.goalId ? getGoal(stats.latestSession.goalId) : null

        return {
          id: stats.latestSession.id,
          name: activityName,
          duration: formatDuration(stats.totalTime),
          date: formatDate(new Date(stats.latestSession.endTime)),
          rating: stats.latestSession.mood || 0,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: stats.latestSession.location,
          totalTime: stats.totalTime,
          sessionCount: stats.sessionCount,
          goalId: stats.latestSession.goalId,
          goalTitle: goalInfo?.title
        }
      })
  }

  // 最新のセッション（最新登録順）
  const getRecentActivities = (): QuickStartActivity[] => {
    return completedSessions
      .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
      .slice(0, 3)
      .map(session => {
        const activityInfo = getActivityStyle(session)
        const goalInfo = session.goalId ? getGoal(session.goalId) : null

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
          goalId: session.goalId,
          goalTitle: goalInfo?.title
        }
      })
  }

  // 昨日の行動
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
        const activityInfo = getActivityStyle(session)
        const goalInfo = session.goalId ? getGoal(session.goalId) : null

        return {
          id: session.id,
          name: session.activityName,
          duration: formatDuration(session.duration),
          date: session.endTime.toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          rating: session.mood || 0,
          category: activityInfo.category,
          icon: activityInfo.icon,
          color: activityInfo.color,
          location: session.location,
          goalId: session.goalId,
          goalTitle: goalInfo?.title
        }
      })
  }

  const handleActivityClick = (activity: QuickStartActivity) => {
    setSelectedActivity(activity)
    setShowModal(true)
  }

  // SPでの詳細表示用のハンドラー
  const handleActivityDetailClick = (activity: QuickStartActivity) => {
    // 対応するセッションを見つける
    const session = completedSessions.find(s => s.id === activity.id)
    if (session) {
      setSelectedSession(session)
      setShowDetailModal(true)
    }
  }

  const handleConfirmStart = async () => {
    if (selectedActivity && onStartActivity) {
      let activityId = selectedActivity.id
      
      // データベースに対応する行動が存在するかチェック
      const correspondingSession = completedSessions.find(session => 
        session.activityName === selectedActivity.name
      )
      
      if (correspondingSession) {
        // 既存のセッションがある場合はその行動IDを使用
        activityId = correspondingSession.activityId
      } else {
        // データベースに直接行動が存在するかチェック
        const existingActivity = activities.find(activity => 
          activity.name === selectedActivity.name
        )
        
        if (existingActivity) {
          activityId = existingActivity.id
        } else {
          // 行動が存在しない場合は新規作成
          const newActivityId = await addActivity({
            name: selectedActivity.name,
            icon: selectedActivity.icon || null,
            color: selectedActivity.color,
          })
          
          if (newActivityId) {
            activityId = newActivityId
          } else {
            console.error('Failed to create activity for QuickStart')
            return
          }
        }
      }
      
      const sessionData: SessionData = {
        activityId: activityId,
        activityName: selectedActivity.name,
        startTime: new Date(),
        location: selectedActivity.location || "",
        notes: "",
        // 行動の色とアイコン情報を保持
        activityColor: selectedActivity.color,
        activityIcon: selectedActivity.icon,
        // 目標IDを保持
        goalId: selectedActivity.goalId,
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
    // 行動IDに対応するセッションを見つける
    const session = completedSessions.find(s => s.id === activity.id)
    if (session) {
      setSelectedSession(session)
      setShowDetailModal(true)
    }
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedSession(null)
    // 詳細モーダルを閉じた時に、前のモーダルを再表示
    if (previousModal === 'activity-count') {
      setShowActivityCountModal(true)
    } else if (previousModal === 'recent-sessions') {
      setShowRecentSessionsModal(true)
    }
    setPreviousModal(null)
  }

  const handleStartSimilar = (sessionData: any) => {
    if (onStartActivity) {
      onStartActivity(sessionData)
    }
  }

  const handleShowActivityCount = () => {
    setShowActivityCountModal(true)
  }

  const handleCloseActivityCount = () => {
    setShowActivityCountModal(false)
  }

  const handleActivityCountDetail = (session: CompletedSession) => {
    // 回数順モーダルを閉じて、詳細モーダルを開く
    setShowActivityCountModal(false)
    setPreviousModal('activity-count')
    setSelectedSession(session)
    setShowDetailModal(true)
  }

  const handleShowRecentSessions = () => {
    setShowRecentSessionsModal(true)
  }

  const handleCloseRecentSessions = () => {
    setShowRecentSessionsModal(false)
  }

  const handleRecentSessionsDetail = (session: CompletedSession) => {
    // 最新モーダルを閉じて、詳細モーダルを開く
    setShowRecentSessionsModal(false)
    setPreviousModal('recent-sessions')
    setSelectedSession(session)
    setShowDetailModal(true)
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
            onClick={() => {
              // SPでは詳細表示（開始ボタンは別途stopPropagationで制御）
              if (isMobile) {
                handleActivityDetailClick(activity)
              }
              // PCでは何もしない（開始・詳細ボタンが個別に制御）
            }}
            className={`flex items-center justify-between p-3 lg:p-4 bg-gray-800 rounded-lg transition-colors group ${isMobile ? 'cursor-pointer hover:bg-gray-700' : ''}`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`w-8 h-8 lg:w-10 lg:h-10 ${activity.color} rounded-full flex items-center justify-center text-sm lg:text-lg`}>
                {activity.icon || ""}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-white font-medium truncate text-sm lg:text-base">{activity.name}</h3>
                </div>

                <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-gray-400">
                  {activeTab === "most-recorded" ? (
                    <>
                      <div className="flex items-center space-x-1">
                        <span className="font-medium text-green-400">{activity.sessionCount}回</span>
                      </div>
                    </>
                                    ) : (
                    <>
                      <div className="flex items-center">
                        <span className="text-blue-400">{activity.date}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* SP版とPC版で構造を分ける */}
            {isMobile ? (
              // SP版: 開始ボタンのみ
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleActivityClick(activity)
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                開始
              </Button>
            ) : (
              // PC版: 詳細ボタン + 開始ボタン
              <div className="flex items-center space-x-2">
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
            )}
          </div>
        ))}
      </div>
    )
  }

  if (completedSessions.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center text-[1.25rem] md:text-2xl">
            開始する
          </CardTitle>
          <p className="text-gray-400 text-sm">最近の行動から素早く開始</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">まだ行動がありません</p>
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
          <CardTitle className="text-white flex items-center text-[1.25rem] md:text-2xl">
            開始する
          </CardTitle>
          <p className="text-gray-400 text-sm">最近の行動から素早く開始</p>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                最新
              </TabsTrigger>
              <TabsTrigger 
                value="most-recorded" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                回数順
              </TabsTrigger>
              <TabsTrigger 
                value="yesterday" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                昨日
              </TabsTrigger>
            </TabsList>

            <TabsContent value="most-recorded" className="mt-4">
              {renderActivityList(
                getMostRecordedActivities(),
                "まだ十分なデータがありません"
              )}
              {/* 回数順タブ：ユニークな行動が3つを超える場合のみ表示 */}
              {getMostRecordedActivities().length >= 3 && Array.from(new Set(completedSessions.map(s => s.activityName))).length > 3 && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowActivityCount}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    もっと見る
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="mt-4">
              {renderActivityList(
                getRecentActivities(),
                "最近の行動がありません"
              )}
              {/* 最新タブ：全セッション数が3つを超える場合のみ表示 */}
              {completedSessions.length > 3 && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowRecentSessions}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    もっと見る
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="yesterday" className="mt-4">
              {renderActivityList(
                getYesterdayActivities(),
                "昨日の行動がありません"
              )}
              {/* 昨日タブ：昨日の行動が3つを超える場合のみ表示 */}
              {getYesterdayActivities().length > 3 && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowRecentSessions}
                    className="text-gray-400 hover:text-white hover:bg-gray-800"
                  >
                    <MoreHorizontal className="w-4 h-4 mr-1" />
                    もっと見る
                  </Button>
                </div>
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

      <ActivityCountModal
        isOpen={showActivityCountModal}
        completedSessions={completedSessions}
        onClose={handleCloseActivityCount}
        onStartActivity={onStartActivity}
        onViewDetail={handleActivityCountDetail}
      />

      <RecentSessionsModal
        isOpen={showRecentSessionsModal}
        completedSessions={completedSessions}
        onClose={handleCloseRecentSessions}
        onStartActivity={onStartActivity}
        onViewDetail={handleRecentSessionsDetail}
      />
    </>
  )
}
