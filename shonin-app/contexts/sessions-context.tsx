"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useSessionsDb, type SessionWithActivity } from "@/hooks/use-sessions-db"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useTimezone } from "@/contexts/timezone-context"
import { splitSessionByDateInTimezone, getCurrentTimeInTimezone } from "@/lib/timezone-utils"

export interface SessionData {
  activityId: string
  activityName: string
  startTime: Date
  location: string
  notes: string
  targetTime?: number // 目標時間（分単位）
  activityColor?: string // アクティビティの色
  activityIcon?: string // アクティビティのアイコン
  goalId?: string // 紐付ける目標のID
}

export interface CompletedSession extends SessionData {
  id: string
  endTime: Date
  duration: number
  sessionDate?: string // セッション日付（YYYY-MM-DD形式）
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
    getActivityStats, 
    deleteSession 
  } = useSessionsDb()
  
  // 目標管理フック
  const { updateGoal } = useGoalsDb()
  
  // タイムゾーンフック
  const { timezone } = useTimezone()

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
  const updateSessionGoalProgress = async (sessionData: CompletedSession) => {
    if (!sessionData.goalId) {
      return
    }

    try {
      // セッションの時間を秒単位で取得
      const sessionDurationSeconds = sessionData.duration

      // 目標の現在の進捗を更新（秒単位で加算）
      // updateGoal関数は既存の実装を活用し、current_valueを更新
      const success = await updateGoal(sessionData.goalId, {
        // 進捗更新のためのフラグ（新しいフィールド）
        addDuration: sessionDurationSeconds
      } as any)

      if (success) {
        // 目標進捗更新成功
      } else {
        console.error('目標進捗の更新が失敗しました')
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
        
        // SessionDataに変換
        const sessionData: SessionData = {
          activityId: activeSession.activity_id,
          activityName: activeSession.activities.name,
          startTime: new Date(activeSession.start_time),
          location: activeSession.location || '',
          targetTime: undefined, // 目標時間は復元時には設定しない
          notes: '',
          activityColor: activeSession.activities.color,
          activityIcon: activeSession.activities.icon || undefined,
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
    } else if (sessionState === "ended") {
      // 終了時：一時停止中からの終了の場合は追加計算しない
      if (previousState === "active") {
        // アクティブ状態からの終了の場合のみ時間を追加
        const activeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
        pausedTimeRef.current = pausedTimeRef.current + activeElapsed
        setElapsedTime(pausedTimeRef.current) // 表示時間も更新
      } else {
        // 一時停止中からの終了の場合は現在の表示時間をそのまま使用
      }
    } else if (sessionState === "active") {
      // 再開時：新しい開始時刻を記録
      lastActiveTimeRef.current = now
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
      // タイムゾーンを考慮した開始時刻を使用
      const startTimeInTimezone = getCurrentTimeInTimezone(timezone)
      const sessionDate = startTimeInTimezone.toLocaleDateString('sv-SE', { timeZone: timezone })
      
      await addSession({
        activity_id: sessionData.activityId,
        start_time: startTimeInTimezone.toISOString(),
        end_time: null, // 進行中なのでend_timeはnull
        duration: 0,
        session_date: sessionDate, // セッション日付を設定
        location: sessionData.location || null,
        notes: null,
        mood: null,
        achievements: null,
        challenges: null,
        goal_id: sessionData.goalId || null, // 目標IDを保存
      }, true) // refetchをスキップ
      
      // 手動でrefetch
      await refetch()
      
      // セッションデータの開始時刻もタイムゾーンを考慮
      const updatedSessionData = {
        ...sessionData,
        startTime: startTimeInTimezone
      }
      
      // 復元フラグをリセット（新規セッション）
      setIsRestoredSession(false)
      setCurrentSession(updatedSessionData)
      setIsSessionActive(true)
      setSessionState("active")
      
    } catch (error) {
      console.error('セッション開始時のDB保存エラー:', error)
      // エラーが発生してもセッションは開始する
      const startTimeInTimezone = getCurrentTimeInTimezone(timezone)
      const sessionDate = startTimeInTimezone.toLocaleDateString('sv-SE', { timeZone: timezone })
      const updatedSessionData = {
        ...sessionData,
        startTime: startTimeInTimezone
      }
      setIsRestoredSession(false)
      setCurrentSession(updatedSessionData)
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

  // 日付跨ぎを考慮したセッション分割関数（タイムゾーン対応）
  const splitSessionByDate = (startTime: Date, endTime: Date, totalDuration: number) => {
    return splitSessionByDateInTimezone(startTime, endTime, totalDuration, timezone)
  }

  // 保存処理の重複実行を防ぐフラグ
  const saveInProgressRef = useRef(false)

  const saveSession = async (completedSession: CompletedSession): Promise<string | null> => {
    if (saveInProgressRef.current) {
      return null
    }
    
    // 保存処理開始フラグを設定
    saveInProgressRef.current = true
    
    try {
      let mainSessionId: string | null = null
      
      // 進行中セッションがあるかチェック
      const activeSession = sessions.find(session => !session.end_time)
      
      // セッションが日付を跨ぐかチェック（タイムゾーン考慮）
      const startDate = completedSession.startTime.toLocaleDateString('sv-SE', { timeZone: timezone })
      const endDate = completedSession.endTime.toLocaleDateString('sv-SE', { timeZone: timezone })
      
      if (startDate === endDate) {
        // 同じ日のセッション（従来の処理）
        if (activeSession) {
          // 既存の進行中セッションを更新
          const sessionDate = completedSession.startTime.toLocaleDateString('sv-SE', { timeZone: timezone })
          const success = await updateSession(activeSession.id, {
            end_time: completedSession.endTime.toISOString(),
            duration: completedSession.duration,
            session_date: sessionDate, // セッション日付を設定
            notes: completedSession.notes || null,
            mood: completedSession.mood || null,
            achievements: completedSession.achievements || null,
            challenges: completedSession.challenges || null,
          }, true) // refetchをスキップ
          
          if (success) {
            mainSessionId = activeSession.id
          } else {
            throw new Error('セッション更新に失敗しました')
          }
        } else {
          // 新規セッションとして保存
          const sessionDate = completedSession.startTime.toLocaleDateString('sv-SE', { timeZone: timezone })
          mainSessionId = await addSession({
            activity_id: completedSession.activityId,
            start_time: completedSession.startTime.toISOString(),
            end_time: completedSession.endTime.toISOString(),
            duration: completedSession.duration,
            session_date: sessionDate, // セッション日付を設定
            notes: completedSession.notes || null,
            mood: completedSession.mood || null,
            achievements: completedSession.achievements || null,
            challenges: completedSession.challenges || null,
            location: completedSession.location || null,
            goal_id: completedSession.goalId || null, // 目標IDを保存
          }, true) // refetchをスキップ
        }
        
        // 通常のセッション保存完了後にrefetch
        await refetch()
      } else {
        // 日付を跨ぐセッション - 分割して保存
        
        const splitSessions = splitSessionByDate(
          completedSession.startTime,
          completedSession.endTime,
          completedSession.duration
        )

        // 既存の進行中セッションがあれば削除（分割されたセッションで置き換える）
        if (activeSession) {
          await deleteSession(activeSession.id)
        }

        // 分割されたセッションをそれぞれ保存
        for (let i = 0; i < splitSessions.length; i++) {
          const splitSession = splitSessions[i]
          
          // メモや気分などの情報は開始日のセッションに保存
          // （前日に終了して翌日に保存した場合、前日のセッションに記録される）
          const isStartSession = i === 0 // 最初のセッション（開始日）をメインとする
          const isLastSession = i === splitSessions.length - 1 // 最後のセッション
          
          const sessionId = await addSession({
            activity_id: completedSession.activityId,
            start_time: splitSession.startTime.toISOString(),
            end_time: splitSession.endTime.toISOString(),
            duration: splitSession.duration,
            session_date: splitSession.date, // 分割時に計算された正しい日付を保存
            notes: isStartSession ? (completedSession.notes || null) : null, // メモは開始日のセッションに
            mood: isStartSession ? (completedSession.mood || null) : null, // 気分も開始日のセッションに
            achievements: isStartSession ? (completedSession.achievements || null) : null,
            challenges: isStartSession ? (completedSession.challenges || null) : null,
            location: completedSession.location || null,
            goal_id: completedSession.goalId || null, // 目標IDを保存
          }, !isLastSession) // 最後のセッション以外はrefetchをスキップ

          if (isStartSession) {
            mainSessionId = sessionId
          }

        }
      }

      // 目標の進捗を更新（分割された全セッションの合計時間で更新）
      if (mainSessionId) {
        await updateSessionGoalProgress(completedSession)
      }

      // セッション終了
      setCurrentSession(null)
      setIsSessionActive(false)
      setSessionState("active")
      
      // セッション終了時にアプリ起動フラグをクリア（次回起動時に自動遷移を有効にする）
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('shonin-app-started')
      }
      
      return mainSessionId
    } catch (error) {
      console.error("セッション保存エラー:", error)
      throw error
    } finally {
      // 保存処理終了フラグをリセット
      saveInProgressRef.current = false
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