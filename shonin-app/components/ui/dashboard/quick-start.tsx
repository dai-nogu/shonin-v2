"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Play, Calendar, Clock, Star, MapPin, BarChart3, History, CalendarDays, Eye, MoreHorizontal, MoreVertical, Target, ChevronDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTranslations } from 'next-intl'

import { SessionDetailModal } from "./session-detail-modal"
import { ActivityCountModal } from "./activity-count-modal"
import { RecentSessionsModal } from "./recent-sessions-modal"
import { useActivities } from "@/contexts/activities-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import type { SessionData, CompletedSession } from "./time-tracker"

interface QuickStartActivity {
  id: string
  name: string
  duration: string
  date: { number: string; text: string }
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
  const t = useTranslations()
  
  const [selectedActivity, setSelectedActivity] = useState<QuickStartActivity | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startingActivityId, setStartingActivityId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("recent")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<CompletedSession | null>(null)
  const [showActivityCountModal, setShowActivityCountModal] = useState(false)
  const [showRecentSessionsModal, setShowRecentSessionsModal] = useState(false)
  const [recentSessionsFilterMode, setRecentSessionsFilterMode] = useState<'all'>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [previousModal, setPreviousModal] = useState<'activity-count' | 'recent-sessions' | null>(null)
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)
  
  // 行動管理フック
  const { activities, addActivity } = useActivities()
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()

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

  // 外側クリックでメニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown="tab-menu"]')) {
        setIsTabMenuOpen(false)
      }
    }
    
    if (isTabMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isTabMenuOpen])

  // タブが変わったらアニメーションをトリガー
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [activeTab])

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

    // 保存されていない場合はデフォルト値を返す
    return {
      icon: "",
      color: "bg-usuzumi",
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
      return forMobile ? `${hours}\u2009h ${minutes}\u2009min` : `${hours}\u2009h ${minutes}\u2009min`
    }
    return forMobile ? `${minutes}\u2009min` : `${minutes}\u2009min`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('time.today')
    if (diffDays === 1) return t('time.yesterday')
    if (diffDays < 7) return `${diffDays}${t('time.days_ago')}`
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  const formatRelativeTime = (date: Date): { number: string; text: string } => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffTime / (1000 * 60))

    if (diffMinutes < 60) return { number: String(diffMinutes), text: t('time.minutes_ago') }
    if (diffHours < 24) return { number: String(diffHours), text: t('time.hours_ago') }
    
    // それ以降は日付を表示
    return { number: '', text: date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" }) }
  }

  // 行動別（実行回数が多い順）- useMemoで最適化
  const mostRecordedActivities = useMemo((): QuickStartActivity[] => {
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
          date: formatRelativeTime(new Date(stats.latestSession.endTime)),
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
  }, [completedSessions, getGoal])

  // 最新のセッション（最新登録順）- useMemoで最適化
  const recentActivities = useMemo((): QuickStartActivity[] => {
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
  }, [completedSessions, getGoal])

  const handleActivityClick = async (activity: QuickStartActivity) => {
    // 既にローディング中なら何もしない
    if (isStarting) return
    
    setSelectedActivity(activity)
    setIsStarting(true)
    setStartingActivityId(activity.id)
    
    // 確認モーダルを表示せず、直接セッション開始処理を実行
    if (onStartActivity) {
      // 少し遅延を入れて開始感を演出（セッション詳細モーダルと同じ）
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      let activityId = activity.id
      
      // データベースに対応する行動が存在するかチェック
      const correspondingSession = completedSessions.find(session => 
        session.activityName === activity.name
      )
      
      if (correspondingSession) {
        // 既存のセッションがある場合はその行動IDを使用
        activityId = correspondingSession.activityId
      } else {
        // データベースに直接行動が存在するかチェック
        const existingActivity = activities.find(existingActivity => 
          existingActivity.name === activity.name
        )
        
        if (existingActivity) {
          activityId = existingActivity.id
        } else {
          // 行動が存在しない場合は新規作成
          // sessionStorageから現在選択されている目標を取得
          const currentSelectedGoal = sessionStorage.getItem('currentSelectedGoal')
          
          const result = await addActivity({
            name: activity.name,
            icon: activity.icon || null,
            color: activity.color,
            goal_id: currentSelectedGoal || null, // 現在選択されている目標IDを紐付ける
          })
          
          if (result.success) {
            activityId = result.data
          } else {
            // アクティビティ作成に失敗した場合は処理を中止
            setIsStarting(false)
            setStartingActivityId(null)
            return
          }
        }
      }
      
      // sessionStorageから現在選択されている目標を取得
      const currentSelectedGoal = sessionStorage.getItem('currentSelectedGoal')
      
      const sessionData: SessionData = {
        activityId: activityId,
        activityName: activity.name,
        startTime: new Date(),
        location: activity.location || "",
        notes: "",
        // 行動の色とアイコン情報を保持
        activityColor: activity.color,
        activityIcon: activity.icon,
        // 現在選択されている目標を使用（過去のセッションの目標ではなく）
        goalId: currentSelectedGoal || activity.goalId,
      }
      onStartActivity(sessionData)
    }
    
    setSelectedActivity(null)
    setIsStarting(false)
    setStartingActivityId(null)
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
    // 詳細モーダルを閉じた時は直接ダッシュボードに戻る（前のモーダルは再表示しない）
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
        <div className="text-center py-7">
          <p className="text-gray-400">{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={`${activity.id}-${activeTab}-${animationKey}`}
            onClick={() => {
              if (isMobile) {
                handleActivityDetailClick(activity)
              }
            }}
            className={`relative overflow-hidden flex items-center justify-between p-4 rounded-xl border border-white/10 transition-all duration-300 group ${isMobile ? 'cursor-pointer' : ''}`}
            style={{ 
              animation: `slideInFromBack 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
              animationDelay: `${index * 80}ms`,
              opacity: 0,
              transform: 'translateZ(-100px) scale(0.8)'
            }}
          >
            {/* 3点ドットボタン（カード右上に配置） */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-5 w-5 rounded-full hover:bg-gray-700/50 text-white hover:text-white border border-white p-0 z-20"
              onClick={(e) => {
                e.stopPropagation()
                handleViewDetail(activity)
              }}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
            
            <div className="flex items-center space-x-4 flex-1 min-w-0 relative z-10">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${activity.color} text-xl`}>
                {activity.icon || activity.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-bold truncate text-base lg:text-lg drop-shadow-md">{activity.name}</h3>
                </div>

                <div className="flex items-center space-x-3 text-xs lg:text-sm text-gray-300">
                  {activeTab === "most-recorded" ? (
                    <>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-bold text-emerald-400">{activity.sessionCount}</span>
                        <span className="text-xs text-gray-300 opacity-90">
                          {activity.sessionCount === 1 ? t('common.time') : t('common.times')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1">
                        {activity.date.number ? (
                          <>
                            <span className="text-sm font-bold text-emerald-400">{activity.date.number}</span>
                            <span className="text-xs text-gray-300 opacity-90">{activity.date.text}</span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300 font-medium">{activity.date.text}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center space-x-2 relative z-10 pl-4 pr-6">
              {/* SP版: 開始ボタン */}
              {isMobile ? (
                <>
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
                      disabled={isStarting}
                      className={`h-10 w-10 rounded-full shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
                        startingActivityId === activity.id 
                          ? "bg-gray-700 cursor-wait" 
                          : "bg-emerald-700 text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivityClick(activity)
                      }}
                    >
                      {startingActivityId === activity.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </Button>
                  )}
                </>
              ) : (
                // PC版: 開始ボタン
                <>
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
                      disabled={isStarting}
                      className={`px-5 shadow-lg shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
                        startingActivityId === activity.id 
                          ? "bg-gray-700 cursor-wait" 
                          : "bg-emerald-700 text-white border-0"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivityClick(activity)
                      }}
                    >
                      {startingActivityId === activity.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          {t('common.starting')}
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1.5 fill-current" />
                          {t('common.start')}
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (completedSessions.length === 0) {
    return (
      <Card className="bg-transparent border-0 shadow-none">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-white flex items-center text-xl md:text-2xl font-bold">
            <span className="text-[#fffffC]">
              {t('quick_start.start_activity')}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="rounded-xl border border-white/10 p-5">
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm mt-2">{t('quick_start.complete_first_session')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-transparent border-0 shadow-none group/card">
        <div className="rounded-xl border border-white/10 p-5 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-visible">
          {/* グローエフェクト用のオーバーレイ */}
          <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
          </div>

          <CardHeader className="px-0 pt-0 pb-4 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center text-xl md:text-2xl font-bold">
                <span className="text-[#fffffC]">
                  {t('quick_start.start_activity')}
                </span>
              </CardTitle>
            
            {/* タブ切り替え - モダンなドロップダウン */}
            <div className="relative z-[100]" data-dropdown="tab-menu">
              <button
                onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-[#0f1115]/80 hover:bg-[#0f1115] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 text-gray-300 hover:text-white backdrop-blur-sm ${
                  isTabMenuOpen ? 'bg-[#0f1115] border-white/20 text-white shadow-lg' : ''
                }`}
              >
                <span>
                  {activeTab === "recent" ? t('quick_start.latest') : t('quick_start.most_recorded')}
                </span>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isTabMenuOpen ? 'rotate-180 text-gray-300' : ''}`} />
              </button>
              
              {/* ドロップダウンメニュー - 左側に表示 */}
              <div
                className={`absolute right-full top-1/2 -translate-y-1/2 mr-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl transition-all duration-200 origin-right z-[110] ${
                  isTabMenuOpen 
                    ? 'opacity-100 scale-100 translate-x-0 visible' 
                    : 'opacity-0 scale-95 translate-x-2 invisible pointer-events-none'
                }`}
              >
                <div className="p-1 space-y-0.5">
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setActiveTab("recent")
                      setIsTabMenuOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors ${
                      activeTab === "recent"
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t('quick_start.latest')}
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setActiveTab("most-recorded")
                      setIsTabMenuOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-xs font-medium text-left rounded-lg transition-colors ${
                      activeTab === "most-recorded"
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {t('quick_start.most_recorded')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 relative z-10">
          {/* Bento Grid Layout */}
          <div className="w-full">
            {/* タブコンテンツ */}
            <div className="mt-2">
              {activeTab === "most-recorded" && (
                <>
                  {renderActivityList(
                    mostRecordedActivities,
                    t('quick_start.not_enough_data')
                  )}
                  {mostRecordedActivities.length > 0 && (
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowActivityCountModal(true)}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <MoreHorizontal className="w-4 h-4 mr-1" />
                        {t('quick_start.see_more')}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {activeTab === "recent" && (
                <>
                  {renderActivityList(
                    recentActivities,
                    t('quick_start.no_recent_activity')
                  )}
                  {recentActivities.length > 0 && (
                    <div className="flex justify-end mt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRecentSessionsFilterMode('all')
                          setShowRecentSessionsModal(true)
                        }}
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <MoreHorizontal className="w-4 h-4 mr-1" />
                        {t('quick_start.see_more')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
        </div>
      </Card>



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
        filterMode={recentSessionsFilterMode}
      />
    </>
  )
}
