"use client"

import { createContext, useContext, useState, ReactNode } from "react"
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
  // セッション操作
  startSession: (sessionData: SessionData) => void
  endSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  saveSession: (completedSession: CompletedSession) => Promise<void>
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

  const saveSession = async (completedSession: CompletedSession) => {
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
      })

      if (sessionId && completedSession.tags.length > 0) {
        await addSessionTags(sessionId, completedSession.tags)
      }

      // セッション終了
      setCurrentSession(null)
      setIsSessionActive(false)
      setSessionState("active")
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