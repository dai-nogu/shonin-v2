"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { Settings } from "@/components/settings"
import { Goals } from "@/components/goals"
import { TimeTracker } from "@/components/time-tracker"
import { CalendarView } from "@/components/calendar-view"
import { ActiveSession } from "@/components/active-session"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useSessions } from "@/contexts/sessions-context"
import type { SessionData, CompletedSession } from "@/components/time-tracker"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  const [isInitialized, setIsInitialized] = useState(false)
  
  // セッション管理をコンテキストから取得
  const {
    sessions,
    currentSession,
    isSessionActive,
    sessionState,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    saveSession,
  } = useSessions()

  // localStorageからページ状態を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPage = localStorage.getItem('shonin-current-page')
      const savedViewMode = localStorage.getItem('shonin-calendar-view-mode')
      
      if (savedPage) {
        setCurrentPage(savedPage)
      }
      if (savedViewMode && (savedViewMode === 'month' || savedViewMode === 'week')) {
        setCalendarViewMode(savedViewMode)
      }
      
      setIsInitialized(true)
    }
  }, [])

  // ページ状態をlocalStorageに保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('shonin-current-page', currentPage)
    }
  }, [currentPage, isInitialized])

  // カレンダービューモードをlocalStorageに保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('shonin-calendar-view-mode', calendarViewMode)
    }
  }, [calendarViewMode, isInitialized])

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const handleWeekViewTransition = () => {
    setCalendarViewMode("week")
    setCurrentPage("calendar")
  }

  // セッション開始
  const handleStartSession = async (sessionData: SessionData) => {
    await startSession(sessionData)
    setCurrentPage("session") // セッション専用ページに遷移
  }

  // セッション終了
  const handleEndSession = () => {
    endSession()
    setCurrentPage("session") // 終了画面に遷移
  }

  // セッション保存
  const handleSaveSession = async (sessionData: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await saveSession(sessionData)
      setCurrentPage("dashboard") // ダッシュボードに戻る
      return sessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      // エラーハンドリング - 必要に応じてユーザーに通知
      return null
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    setCurrentPage("session")
  }

  // 目標管理画面への遷移
  const handleGoalSettingClick = () => {
    setCurrentPage("goals")
  }

  // 一時停止/再開
  const handleTogglePause = () => {
    if (sessionState === "active") {
      pauseSession()
    } else {
      resumeSession()
    }
  }

  // セッション再開（終了状態からアクティブ状態に戻る）
  const handleResumeSession = () => {
    resumeSession()
  }

  // セッション画面でセッションが存在しない場合にダッシュボードに戻る
  useEffect(() => {
    if (currentPage === "session" && !isSessionActive) {
      setCurrentPage("dashboard")
    }
  }, [currentPage, isSessionActive])

  // 初期化が完了するまでローディング表示
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // CompletedSessionの型に合わせて変換
  const completedSessions: CompletedSession[] = sessions
    .filter(session => session.end_time)
    .map(session => ({
      id: session.id,
      activityId: session.activity_id,
      activityName: session.activities?.name || '不明',
      startTime: new Date(session.start_time),
      endTime: new Date(session.end_time!),
      duration: session.duration,

      location: session.location || '',
      notes: session.notes || '',
      mood: session.mood || undefined,
      achievements: session.achievements || undefined,
      challenges: session.challenges || undefined,
      // アクティビティの色とアイコン情報を追加
      activityColor: session.activities?.color,
      activityIcon: session.activities?.icon || undefined,
    }))

  console.log('Completed sessions for QuickStart:', completedSessions)

  const renderContent = () => {
    switch (currentPage) {
      case "session":
        if (isSessionActive && currentSession) {
          return (
            <ActiveSession 
              session={currentSession} 
              onEnd={handleEndSession} 
              onSave={handleSaveSession}
              sessionState={sessionState}
              onTogglePause={handleTogglePause}
              onResume={handleResumeSession}
            />
          )
        }
        // セッションがない場合は何も表示しない（useEffectでダッシュボードに戻る）
        return null
        
      case "calendar":
        return <CalendarView 
          viewMode={calendarViewMode} 
          onViewModeChange={setCalendarViewMode} 
          completedSessions={completedSessions}
        />
        
      case "analytics":
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">統計・分析</h1>
            </div>
            <div className="p-8 text-center text-gray-400">統計・分析ページ（開発中）</div>
          </div>
        )
        
      case "goals":
        return <Goals onBack={() => setCurrentPage("dashboard")} />
        
      case "settings":
        return <Settings 
          onBack={() => setCurrentPage("dashboard")} 
          currentSession={currentSession ? {
            activityId: currentSession.activityId,
            activityName: currentSession.activityName
          } : null}
          isSessionActive={isSessionActive}
        />
        
      default:
        return (
          <>
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* メインエリア - 2列分 */}
                <div className="lg:col-span-2 space-y-6">
                  <WelcomeCard completedSessions={completedSessions} />
                  <TimeTracker onStartSession={handleStartSession} completedSessions={completedSessions} onGoalSettingClick={handleGoalSettingClick} />
                </div>

                {/* サイドバー - 1列分 */}
                <div className="space-y-6">
                  {/* 進行中のアクティビティ */}
                  <ActiveActivitySidebar
                    activeSession={currentSession}
                    isActive={isSessionActive}
                    onViewSession={handleViewSession}
                    onTogglePause={handleTogglePause}
                    onEnd={handleEndSession}
                    sessionState={sessionState}
                  />
                  
                  <AIFeedback completedSessions={completedSessions} />
                  <WeeklyProgress completedSessions={completedSessions} onWeekViewClick={handleWeekViewTransition} />
                </div>
              </div>
            </main>
          </>
        )
    }
  }

  return (
    <>
      <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
      <SidebarInset>
        <div className="min-h-screen bg-gray-950 text-white">
          {renderContent()}
        </div>
      </SidebarInset>
    </>
  )
}
