"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useSessionsDb, type SessionWithActivity } from "@/hooks/use-sessions-db"

export interface SessionData {
  activityId: string
  activityName: string
  startTime: Date
  tags: string[]
  location: string
  notes: string
}

export interface CompletedSession extends SessionData {
  id: string
  endTime: Date
  duration: number
  mood?: number
  achievements?: string
  challenges?: string
}

export type SessionState = "active" | "paused" | "ended"

interface SessionsContextType {
  sessions: SessionWithActivity[]
  loading: boolean
  error: string | null
  // 現在のセッション管理
  currentSession: SessionData | null
  isSessionActive: boolean
  sessionState: SessionState
  // タイマー管理（一元化）
  elapsedTime: number
  formattedTime: string
  // セッション操作
  startSession: (sessionData: SessionData) => void
  endSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  saveSession: (completedSession: CompletedSession) => Promise<string | null>
  // データベース操作
  refetch: () => Promise<void>
  getSessionsByDateRange: (startDate: string, endDate: string) => Promise<SessionWithActivity[]>
  getActivityStats: () => Promise<any[]>
}

const SessionsContext = createContext<SessionsContextType | undefined>(undefined)

interface SessionsProviderProps {
  children: ReactNode
}

export function SessionsProvider({ children }: SessionsProviderProps) {
  const {
    sessions,
    loading,
    error,
    addSession,
    addSessionTags,
    getSessionsByDateRange,
    getActivityStats,
    refetch,
  } = useSessionsDb()

  // 現在のセッション状態
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionState, setSessionState] = useState<SessionState>("active")

  // 一元化されたタイマー状態（useRefを使用）
  const [elapsedTime, setElapsedTime] = useState(0)
  const pausedTimeRef = useRef(0) // 一時停止中の累積時間
  const lastActiveTimeRef = useRef<Date | null>(null) // 最後にactiveになった時刻
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // セッションが変わった時の初期化
  useEffect(() => {
    if (currentSession) {
      lastActiveTimeRef.current = currentSession.startTime
      pausedTimeRef.current = 0
      setElapsedTime(0)
    }
  }, [currentSession])

  // リアルタイム時間更新
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    if (currentSession && sessionState === "active" && lastActiveTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current!.getTime()) / 1000)
        setElapsedTime(pausedTimeRef.current + activeElapsed)
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentSession, sessionState])

  // sessionStateが変わった時の処理
  useEffect(() => {
    if (!currentSession || !lastActiveTimeRef.current) return
    
    const now = new Date()
    
    if (sessionState === "paused") {
      // 一時停止時：現在の経過時間を累積一時停止時間に保存
      const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
      pausedTimeRef.current = pausedTimeRef.current + activeElapsed
      setElapsedTime(pausedTimeRef.current) // 表示時間も更新
      console.log(`一時停止: 現在のアクティブ時間=${activeElapsed}秒, 累積実働時間=${pausedTimeRef.current}秒`)
    } else if (sessionState === "ended") {
      // 終了時：現在の経過時間を累積一時停止時間に保存
      const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
      pausedTimeRef.current = pausedTimeRef.current + activeElapsed
      setElapsedTime(pausedTimeRef.current) // 表示時間も更新
      console.log(`終了: 現在のアクティブ時間=${activeElapsed}秒, 最終実働時間=${pausedTimeRef.current}秒`)
    } else if (sessionState === "active") {
      // 再開時：新しい開始時刻を記録
      lastActiveTimeRef.current = now
      console.log(`再開: 累積実働時間=${pausedTimeRef.current}秒から再開`)
    }
  }, [sessionState, currentSession])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const startSession = (sessionData: SessionData) => {
    setCurrentSession(sessionData)
    setIsSessionActive(true)
    setSessionState("active")
  }

  const endSession = () => {
    setSessionState("ended")
  }

  const pauseSession = () => {
    setSessionState("paused")
  }

  const resumeSession = () => {
    setSessionState("active")
  }

  const saveSession = async (completedSession: CompletedSession): Promise<string | null> => {
    try {
      const sessionId = await addSession({
        activity_id: completedSession.activityId,
        start_time: completedSession.startTime.toISOString(),
        end_time: completedSession.endTime.toISOString(),
        duration: completedSession.duration,
        notes: completedSession.notes || null,
        mood: completedSession.mood || null,
        achievements: completedSession.achievements || null,
        challenges: completedSession.challenges || null,
        location: completedSession.location || null,
        
        // 詳細振り返り情報（統合）
        mood_score: (completedSession as any).moodScore || null,
        mood_notes: (completedSession as any).moodNotes || null,
        detailed_achievements: (completedSession as any).detailedAchievements || null,
        achievement_satisfaction: (completedSession as any).achievementSatisfaction || null,
        detailed_challenges: (completedSession as any).detailedChallenges || null,
        challenge_severity: (completedSession as any).challengeSeverity || null,
        reflection_notes: (completedSession as any).reflectionNotes || null,
        reflection_duration: (completedSession as any).reflectionDuration || null,
      })

      if (sessionId && completedSession.tags.length > 0) {
        await addSessionTags(sessionId, completedSession.tags)
      }

      // セッション終了
      setCurrentSession(null)
      setIsSessionActive(false)
      setSessionState("active")
      
      return sessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      throw error
    }
  }

  return (
    <SessionsContext.Provider
      value={{
        sessions,
        loading,
        error,
        currentSession,
        isSessionActive,
        sessionState,
        elapsedTime,
        formattedTime: formatTime(elapsedTime),
        startSession,
        endSession,
        pauseSession,
        resumeSession,
        saveSession,
        refetch,
        getSessionsByDateRange,
        getActivityStats,
      }}
    >
      {children}
    </SessionsContext.Provider>
  )
}

export function useSessions() {
  const context = useContext(SessionsContext)
  if (context === undefined) {
    throw new Error("useSessions must be used within a SessionsProvider")
  }
  return context
} 