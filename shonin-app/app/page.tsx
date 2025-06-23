"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { WelcomeCard } from "@/components/welcome-card"
import { AIFeedback } from "@/components/ai-feedback"
import { WeeklyProgress } from "@/components/weekly-progress"
import { GoalProgress } from "@/components/goal-progress"
import { TimeTracker } from "@/components/time-tracker"
import { CalendarView } from "@/components/calendar-view"
import { ActiveSession } from "@/components/active-session"
import { ActiveActivitySidebar } from "@/components/active-activity-sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import type { SessionData, CompletedSession } from "@/components/time-tracker"

type SessionState = "active" | "paused" | "ended"

export default function Dashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  
  // セッション管理の状態
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>("active")
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId)
  }

  const handleWeekViewTransition = () => {
    setCalendarViewMode("week")
    setCurrentPage("calendar")
  }

  // セッション開始
  const handleStartSession = (sessionData: SessionData) => {
    setCurrentSession(sessionData)
    setIsSessionActive(true)
    setSessionState("active")
    setCurrentPage("session") // セッション専用ページに遷移
  }

  // セッション終了
  const handleEndSession = () => {
    setSessionState("ended")
  }

  // セッション保存
  const handleSaveSession = (sessionData: CompletedSession) => {
    const newSession = {
      ...sessionData,
      id: Date.now().toString(),
    }
    setCompletedSessions((prev) => [newSession, ...prev])
    
    // セッション終了
    setIsSessionActive(false)
    setCurrentSession(null)
    setSessionState("active")
    setCurrentPage("dashboard") // ダッシュボードに戻る
  }

  // セッション詳細表示
  const handleViewSession = () => {
    setCurrentPage("session")
  }

  // 一時停止/再開
  const handleTogglePause = () => {
    setSessionState(sessionState === "active" ? "paused" : "active")
  }

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
            />
          )
        }
        // セッションがない場合はダッシュボードに戻る
        setCurrentPage("dashboard")
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
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">目標管理</h1>
            </div>
            <div className="p-8 text-center text-gray-400">目標管理ページ（開発中）</div>
          </div>
        )
        
      case "settings":
        return (
          <div className="min-h-screen bg-gray-950 text-white">
            <div className="border-b border-gray-800 p-6">
              <h1 className="text-2xl font-bold">設定</h1>
            </div>
            <div className="p-8 text-center text-gray-400">設定ページ（開発中）</div>
          </div>
        )
        
      default:
        return (
          <>
            <Header />
            <main className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* メインエリア - 2列分 */}
                <div className="lg:col-span-2 space-y-6">
                  <WelcomeCard completedSessions={completedSessions} />
                  <TimeTracker onStartSession={handleStartSession} completedSessions={completedSessions} />
                </div>

                {/* サイドバー - 1列分 */}
                <div className="space-y-6">
                  {/* 進行中のアクティビティ */}
                  <ActiveActivitySidebar
                    activeSession={currentSession}
                    isActive={isSessionActive}
                    onViewSession={handleViewSession}
                    onTogglePause={handleTogglePause}
                    sessionState={sessionState}
                  />
                  
                  <AIFeedback completedSessions={completedSessions} />
                  <WeeklyProgress completedSessions={completedSessions} onWeekViewClick={handleWeekViewTransition} />
                  <GoalProgress />
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
