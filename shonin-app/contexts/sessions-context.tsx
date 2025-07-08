"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useSessionsDb, type SessionWithActivity } from "@/hooks/use-sessions-db"
import { useGoalsDb } from "@/hooks/use-goals-db"

export interface SessionData {
  activityId: string
  activityName: string
  startTime: Date
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
  // 目標ID（SessionDataから継承されるが明示的に記載）
  goalId?: string
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
  startSession: (sessionData: SessionData) => Promise<void>
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
  // データベースフック
  const { 
    sessions, 
    loading, 
    error, 
    addSession, 
    updateSession, 
    refetch, 
    getSessionsByDateRange, 
    getActivityStats 
  } = useSessionsDb()
  
  // 目標管理フック
  const { updateGoal } = useGoalsDb()

  // セッション状態管理
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionState, setSessionState] = useState<SessionState>("active")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRestoring, setIsRestoring] = useState(true)
  const [isRestoredSession, setIsRestoredSession] = useState(false)

  // タイマー関連のref
  const lastActiveTimeRef = useRef<Date>(new Date())
  const pausedTimeRef = useRef<number>(0)
  const previousSessionStateRef = useRef<SessionState>("active")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // セッション保存時に目標の進捗を更新する関数
  const updateGoalProgress = async (sessionData: CompletedSession) => {
    if (!sessionData.goalId) {
      console.log('目標IDが設定されていないため、進捗更新をスキップします')
      return
    }

    try {
      console.log('目標進捗更新を開始:', { 
        goalId: sessionData.goalId, 
        duration: sessionData.duration,
        activityName: sessionData.activityName 
      })

      // セッションの時間を秒単位で取得
      const sessionDurationSeconds = sessionData.duration

      // 目標の現在の進捗を更新（秒単位で加算）
      // updateGoal関数は既存の実装を活用し、current_valueを更新
      const success = await updateGoal(sessionData.goalId, {
        // 進捗更新のためのフラグ（新しいフィールド）
        addDuration: sessionDurationSeconds
      })

      if (success) {
        console.log(`目標進捗を更新しました: goalId=${sessionData.goalId}, +${sessionDurationSeconds}秒`)
      } else {
        console.error('目標進捗の更新が失敗しました（updateGoalがfalseを返しました）')
      }
    } catch (error) {
      console.error('目標進捗の更新に失敗:', error)
      console.error('エラー詳細:', { 
        goalId: sessionData.goalId, 
        duration: sessionData.duration,
        errorMessage: error instanceof Error ? error.message : String(error)
      })
      // エラーが発生してもセッション保存は継続
    }
  }

  // ページロード時に進行中セッションを復元
  useEffect(() => {
    const restoreActiveSession = async () => {
      if (!sessions || sessions.length === 0) {
        setIsRestoring(false)
        return
      }

      // end_timeがnullの進行中セッションを探す
      const activeSession = sessions.find(session => !session.end_time)
      
      if (activeSession && activeSession.activities) {
        console.log('進行中セッションを復元中:', activeSession)
        
        // SessionDataに変換
        const sessionData: SessionData = {
          activityId: activeSession.activity_id,
          activityName: activeSession.activities.name,
          startTime: new Date(activeSession.start_time),
          location: activeSession.location || '',
          targetTime: undefined, // 目標時間は復元時には設定しない
          notes: '',
          activityColor: activeSession.activities.color,
          activityIcon: activeSession.activities.icon,
          goalId: activeSession.goal_id || undefined, // 目標IDを復元
        }

        // 経過時間を計算
        const now = new Date()
        const startTime = new Date(activeSession.start_time)
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        
        // タイマー状態を設定（復元時は元の開始時刻を基準にする）
        lastActiveTimeRef.current = startTime
        pausedTimeRef.current = 0
        setElapsedTime(elapsed)
        
        // 復元フラグを設定
        setIsRestoredSession(true)
        
        // 前回の状態を復元時の状態に設定
        previousSessionStateRef.current = "active"
        
        // セッション状態を復元
        setCurrentSession(sessionData)
        setIsSessionActive(true)
        setSessionState("active")
        
        console.log('進行中セッションを復元しました:', {
          sessionData,
          elapsedTime: elapsed,
          formattedTime: formatTime(elapsed)
        })
      }
      
      setIsRestoring(false)
    }

    if (!loading) {
      restoreActiveSession()
    }
  }, [sessions, loading])

  // セッションが変わった時の初期化（復元時は除く）
  useEffect(() => {
    if (currentSession && !isRestoredSession) {
      lastActiveTimeRef.current = currentSession.startTime
      pausedTimeRef.current = 0
      setElapsedTime(0)
    }
    // 復元フラグをリセット
    if (isRestoredSession) {
      setIsRestoredSession(false)
    }
  }, [currentSession, isRestoredSession])

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
    const previousState = previousSessionStateRef.current
    
    if (sessionState === "paused") {
      // 一時停止時：現在の経過時間を累積一時停止時間に保存
      const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
      pausedTimeRef.current = pausedTimeRef.current + activeElapsed
      setElapsedTime(pausedTimeRef.current) // 表示時間も更新
      console.log(`一時停止: 現在のアクティブ時間=${activeElapsed}秒, 累積実働時間=${pausedTimeRef.current}秒`)
    } else if (sessionState === "ended") {
      // 終了時：一時停止中からの終了の場合は追加計算しない
      if (previousState === "active") {
        // アクティブ状態からの終了の場合のみ時間を追加
        const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
        pausedTimeRef.current = pausedTimeRef.current + activeElapsed
        setElapsedTime(pausedTimeRef.current) // 表示時間も更新
        console.log(`終了(アクティブから): 現在のアクティブ時間=${activeElapsed}秒, 最終実働時間=${pausedTimeRef.current}秒`)
      } else {
        // 一時停止中からの終了の場合は現在の表示時間をそのまま使用
        console.log(`終了(一時停止から): 最終実働時間=${pausedTimeRef.current}秒（追加計算なし）`)
      }
    } else if (sessionState === "active") {
      // 再開時：新しい開始時刻を記録
      lastActiveTimeRef.current = now
      console.log(`再開: 累積実働時間=${pausedTimeRef.current}秒から再開`)
    }
    
    // 前回の状態を記録
    previousSessionStateRef.current = sessionState
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

  const startSession = async (sessionData: SessionData) => {
    // データベースに進行中セッションを保存
    try {
      await addSession({
        activity_id: sessionData.activityId,
        start_time: sessionData.startTime.toISOString(),
        end_time: null, // 進行中なのでend_timeはnull
        duration: 0,
        location: sessionData.location || null,
        notes: null,
        mood: null,
        achievements: null,
        challenges: null,
        goal_id: sessionData.goalId || null, // 目標IDを保存
      })
      
      // 復元フラグをリセット（新規セッション）
      setIsRestoredSession(false)
      setCurrentSession(sessionData)
      setIsSessionActive(true)
      setSessionState("active")
      
      console.log('セッションを開始し、データベースに保存しました')
    } catch (error) {
      console.error('セッション開始時のDB保存エラー:', error)
      // エラーが発生してもセッションは開始する
      setIsRestoredSession(false)
      setCurrentSession(sessionData)
      setIsSessionActive(true)
      setSessionState("active")
    }
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
      let sessionId: string | null = null
      
      // 進行中セッションを更新する場合と新規作成する場合を分ける
      const activeSession = sessions.find(session => !session.end_time)
      
      if (activeSession) {
        // 既存の進行中セッションを更新
        const success = await updateSession(activeSession.id, {
          end_time: completedSession.endTime.toISOString(),
          duration: completedSession.duration,
          notes: completedSession.notes || null,
          mood: completedSession.mood || null,
          achievements: completedSession.achievements || null,
          challenges: completedSession.challenges || null,
        })
        
        if (success) {
          sessionId = activeSession.id
          console.log('進行中セッションを更新しました:', activeSession.id)
        } else {
          throw new Error('セッション更新に失敗しました')
        }
      } else {
        // 新規セッションとして保存（従来の処理）
        sessionId = await addSession({
          activity_id: completedSession.activityId,
          start_time: completedSession.startTime.toISOString(),
          end_time: completedSession.endTime.toISOString(),
          duration: completedSession.duration,
          notes: completedSession.notes || null,
          mood: completedSession.mood || null,
          achievements: completedSession.achievements || null,
          challenges: completedSession.challenges || null,
          location: completedSession.location || null,
          goal_id: completedSession.goalId || null, // 目標IDを保存
        })
      }

      // 目標の進捗を更新（セッション保存成功後）
      if (sessionId) {
        console.log('セッション保存成功、目標進捗更新を実行:', {
          sessionId,
          goalId: completedSession.goalId,
          hasGoalId: !!completedSession.goalId
        })
        await updateGoalProgress(completedSession)
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
        loading: loading || isRestoring,
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