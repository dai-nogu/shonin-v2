"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react"
import { useLocale, useTranslations } from 'next-intl'
import { useSessionsDb, type SessionWithActivity } from "@/hooks/use-sessions-db"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useReflectionsDb } from "@/hooks/use-reflections-db"
import { useToast } from "@/contexts/toast-context"
import { splitSessionByDate, getCurrentTime } from "@/lib/timezone-utils"
import { getSessionStartMessage } from "@/lib/encouragement-messages"
import type { ActivityStat } from "@/app/actions/sessions"
import { safeWarn } from "@/lib/safe-logger"

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
  getActivityStats: () => Promise<ActivityStat[]>
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
  
  // 振り返りデータ管理フック
  const { saveReflection } = useReflectionsDb()
  
  // トースト通知フック
  const { showSuccess } = useToast()
  
  // 多言語対応フック
  const locale = useLocale()
  const tEncouragement = useTranslations('encouragement')

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

  // セッション状態をlocalStorageに保存する関数
  const saveSessionStateToStorage = useCallback((sessionId: string, state: SessionState, pausedTime: number, lastActiveTime: Date) => {
    if (typeof window === 'undefined') return
    
    const sessionStateData = {
      sessionState: state,
      pausedTime,
      lastActiveTime: lastActiveTime.toISOString(),
      timestamp: Date.now()
    }
    
    localStorage.setItem(`session_state_${sessionId}`, JSON.stringify(sessionStateData))
  }, [])

  // localStorageからセッション状態を復元する関数
  const loadSessionStateFromStorage = useCallback((sessionId: string) => {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(`session_state_${sessionId}`)
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      // 5分以上古いデータは無効とする
      if (Date.now() - data.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem(`session_state_${sessionId}`)
        return null
      }
      
      return {
        sessionState: data.sessionState as SessionState,
        pausedTime: data.pausedTime,
        lastActiveTime: new Date(data.lastActiveTime)
      }
    } catch {
      return null
    }
  }, [])

  // セッション状態のlocalStorageをクリアする関数
  const clearSessionStateFromStorage = useCallback((sessionId: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(`session_state_${sessionId}`)
  }, [])

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
      const result = await updateGoal(sessionData.goalId, {
        // 進捗更新のためのフラグ（新しいフィールド）
        addDuration: sessionDurationSeconds
      } as any)

      if (result.success) {
        // 目標進捗更新成功
      } else {
        // 目標進捗の更新が失敗（エラーは上位で処理）
      }
    } catch (error) {
      // エラーが発生してもセッション保存は継続
    }
  }

  // ページロード時に進行中セッションを復元 - シンプル版
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
          targetTime: undefined,
          notes: '',
          activityColor: activeSession.activities.color,
          activityIcon: activeSession.activities.icon || undefined,
          goalId: activeSession.goal_id || undefined,
        }

        // localStorageから保存されたセッション状態を復元
        const sessionId = activeSession.id
        const savedState = loadSessionStateFromStorage(sessionId)
        
        const now = new Date()
        const startTime = new Date(activeSession.start_time)
        
        if (savedState && (savedState.sessionState === "paused" || savedState.sessionState === "ended")) {
          // 一時停止または終了状態の場合は保存された時間を使用
          setElapsedTime(savedState.pausedTime)
          setSessionState(savedState.sessionState)
          pausedTimeRef.current = savedState.pausedTime
          previousSessionStateRef.current = savedState.sessionState
          // 一時停止・終了状態では lastActiveTimeRef は使用しない
        } else {
          // アクティブ状態または保存データがない場合は開始時刻からの経過時間を計算
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
          setElapsedTime(elapsed)
          setSessionState("active")
          pausedTimeRef.current = 0
          previousSessionStateRef.current = "active"
          lastActiveTimeRef.current = startTime
        }
        
        // セッション状態を復元
        setCurrentSession(sessionData)
        setIsSessionActive(true)
      }
      
      setIsRestoring(false)
    }

    if (!loading) {
      restoreActiveSession()
    }
  }, [sessions, loading])

  // 新規セッション開始時の初期化 - シンプル版
  const initializeNewSession = useCallback((sessionData: SessionData) => {
    setElapsedTime(0)
    pausedTimeRef.current = 0
  }, [])

  // リアルタイム時間更新 - 一時停止対応版
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // セッションがアクティブで、開始時刻がある場合は常にタイマーを動かす
    if (currentSession && isSessionActive && sessionState === "active") {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        
        // 一時停止から再開した場合は、一時停止時点の時間 + 再開時刻からの経過時間
        if (lastActiveTimeRef.current && pausedTimeRef.current > 0) {
          const resumeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
          setElapsedTime(pausedTimeRef.current + resumeElapsed)
        } else {
          // 新規開始の場合は開始時刻からの経過時間
          const totalElapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)
          setElapsedTime(totalElapsed)
        }
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentSession, isSessionActive, sessionState])

  // sessionStateが変わった時の処理 - 一時停止・終了時は時間固定版
  useEffect(() => {
    if (!currentSession) return
    
    const now = new Date()
    
    if (sessionState === "active") {
      // アクティブ状態（再開時）：再開時刻を記録
      if (previousSessionStateRef.current === "paused" || previousSessionStateRef.current === "ended") {
        // 一時停止または終了から再開した場合は現在時刻を記録
        lastActiveTimeRef.current = now
      } else if (previousSessionStateRef.current === "active" && !lastActiveTimeRef.current) {
        // 新規開始の場合
        lastActiveTimeRef.current = currentSession.startTime
      }
    } else if (sessionState === "paused") {
      // 一時停止時：現在の経過時間を保存（初回のみ）
      if (previousSessionStateRef.current === "active") {
        // 一時停止から再開していた場合は、現在の表示時間を使用
        if (lastActiveTimeRef.current && pausedTimeRef.current > 0) {
          const resumeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
          pausedTimeRef.current = pausedTimeRef.current + resumeElapsed
        } else {
          // 新規開始からの一時停止の場合
          const totalElapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)
          pausedTimeRef.current = totalElapsed
        }
        setElapsedTime(pausedTimeRef.current)
      }
      // 既に一時停止状態の場合は時間を変更しない
    } else if (sessionState === "ended") {
      // 終了時：現在の経過時間を保存（初回のみ）
      if (previousSessionStateRef.current !== "ended") {
        // 現在の表示時間を使用（一時停止から終了の場合も考慮）
        if (previousSessionStateRef.current === "paused") {
          pausedTimeRef.current = elapsedTime
        } else if (lastActiveTimeRef.current && pausedTimeRef.current > 0) {
          const resumeElapsed = Math.floor((now.getTime() - lastActiveTimeRef.current.getTime()) / 1000)
          pausedTimeRef.current = pausedTimeRef.current + resumeElapsed
        } else {
          const totalElapsed = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)
          pausedTimeRef.current = totalElapsed
        }
        setElapsedTime(pausedTimeRef.current)
      }
      // 既に終了状態の場合は時間を変更しない
    }
    
    // セッション状態をlocalStorageに保存（現在の表示時間を使用）
    if (sessions.length > 0) {
      const activeSession = sessions.find(session => !session.end_time)
      if (activeSession) {
        // 一時停止・終了状態では現在の表示時間を保存、アクティブ状態では計算
        let timeToSave = elapsedTime
        if (sessionState === "active") {
          timeToSave = Math.floor((now.getTime() - currentSession.startTime.getTime()) / 1000)
        }
        saveSessionStateToStorage(activeSession.id, sessionState, timeToSave, now)
      }
    }
    
    previousSessionStateRef.current = sessionState
  }, [sessionState, currentSession, sessions, saveSessionStateToStorage, elapsedTime])

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
    // 既にアクティブなセッションがある場合は新規開始を無視
    if (isSessionActive && currentSession) {
      safeWarn('既にアクティブなセッションがあるため、新規セッション開始をスキップします')
      return
    }

    // データベースに進行中セッションを保存
    try {
      // タイムゾーンを考慮した開始時刻を使用
      const startTimeInTimezone = getCurrentTime()
      const sessionDate = startTimeInTimezone.toLocaleDateString('sv-SE', { timeZone: timezone })
      
      // その日の既存セッション数を取得（進行中のものを除く）
      const todaysSessions = sessions.filter(session => {
        if (!session.session_date) return false
        const sessionDateStr = new Date(session.session_date).toLocaleDateString('sv-SE')
        return sessionDateStr === sessionDate && session.end_time !== null
      })
      
      // 今回が何回目のセッションか（進行中を含めて+1）
      const sessionCount = todaysSessions.length + 1
      
      // 励ましメッセージをi18nから取得
      const encouragementMessages = tEncouragement.raw('session_start')
      
      const encouragementMessage = getSessionStartMessage(sessionCount, { session_start: encouragementMessages })
      
      const result = await addSession({
        activity_id: sessionData.activityId,
        start_time: startTimeInTimezone.toISOString(),
        end_time: null, // 進行中なのでend_timeはnull
        duration: 0,
        session_date: sessionDate, // セッション日付を設定
        location: sessionData.location || null,
        notes: sessionData.notes || null, // セッション開始時のメモを保存
        goal_id: sessionData.goalId || null, // 目標IDを保存
      }, true) // refetchをスキップ
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // 手動でrefetch
      await refetch()
      
      // セッションデータの開始時刻もタイムゾーンを考慮
      const updatedSessionData = {
        ...sessionData,
        startTime: startTimeInTimezone
      }
      
      // 新規セッションの初期化
      initializeNewSession(updatedSessionData)
      setCurrentSession(updatedSessionData)
      setIsSessionActive(true)
      setSessionState("active")
      
      // 励ましメッセージを表示
      showSuccess(encouragementMessage, 4000)
      
    } catch (error) {
      // エラーが発生してもセッションは開始する
      const startTimeInTimezone = getCurrentTime()
      const sessionDate = startTimeInTimezone.toLocaleDateString('sv-SE', { timeZone: timezone })
      const updatedSessionData = {
        ...sessionData,
        startTime: startTimeInTimezone
      }
      initializeNewSession(updatedSessionData)
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
    return splitSessionByDate(startTime, endTime, totalDuration)
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
          const result = await updateSession(activeSession.id, {
            end_time: completedSession.endTime.toISOString(),
            duration: completedSession.duration,
            session_date: sessionDate, // セッション日付を設定
            notes: completedSession.notes || null,
            location: completedSession.location || null,
          }, true) // refetchをスキップ
          
          if (result.success) {
            mainSessionId = activeSession.id
            
            // 振り返りデータがある場合は暗号化して保存
            if (completedSession.mood || completedSession.achievements || completedSession.challenges) {
              const reflectionData = {
                moodScore: completedSession.mood || 3,
                achievements: completedSession.achievements || '',
                challenges: completedSession.challenges || '',
                additionalNotes: undefined,
              };
              await saveReflection(activeSession.id, reflectionData);
            }
          } else {
            throw new Error(result.error || 'セッション更新に失敗しました')
          }
        } else {
          // 新規セッションとして保存
          const sessionDate = completedSession.startTime.toLocaleDateString('sv-SE', { timeZone: timezone })
          const result = await addSession({
            activity_id: completedSession.activityId,
            start_time: completedSession.startTime.toISOString(),
            end_time: completedSession.endTime.toISOString(),
            duration: completedSession.duration,
            session_date: sessionDate, // セッション日付を設定
            notes: completedSession.notes || null,
            location: completedSession.location || null,
            goal_id: completedSession.goalId || null, // 目標IDを保存
          }, true) // refetchをスキップ
          
          if (result.success) {
            mainSessionId = result.data
            
            // 振り返りデータがある場合は暗号化して保存
            if (mainSessionId && (completedSession.mood || completedSession.achievements || completedSession.challenges)) {
              const reflectionData = {
                moodScore: completedSession.mood || 3,
                achievements: completedSession.achievements || '',
                challenges: completedSession.challenges || '',
                additionalNotes: undefined,
              };
              await saveReflection(mainSessionId, reflectionData);
            }
          } else {
            throw new Error(result.error || 'セッション追加に失敗しました')
          }
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
          const deleteResult = await deleteSession(activeSession.id)
          if (!deleteResult.success) {
            throw new Error(deleteResult.error || '進行中セッションの削除に失敗しました')
          }
        }

        // 分割されたセッションをそれぞれ保存
        for (let i = 0; i < splitSessions.length; i++) {
          const splitSession = splitSessions[i]
          
          // メモや気分などの情報は開始日のセッションに保存
          // （前日に終了して翌日に保存した場合、前日のセッションに記録される）
          const isStartSession = i === 0 // 最初のセッション（開始日）をメインとする
          const isLastSession = i === splitSessions.length - 1 // 最後のセッション
          
          const result = await addSession({
            activity_id: completedSession.activityId,
            start_time: splitSession.startTime.toISOString(),
            end_time: splitSession.endTime.toISOString(),
            duration: splitSession.duration,
            session_date: splitSession.date, // 分割時に計算された正しい日付を保存
            notes: isStartSession ? (completedSession.notes || null) : null, // メモは開始日のセッションに
            location: completedSession.location || null,
            goal_id: completedSession.goalId || null, // 目標IDを保存
          }, !isLastSession) // 最後のセッション以外はrefetchをスキップ

          if (result.success) {
            if (isStartSession) {
              mainSessionId = result.data
            }
          } else {
            throw new Error(result.error || '分割セッションの保存に失敗しました')
          }
        }
        
        // 分割セッション保存後に振り返りデータがある場合は保存
        if (mainSessionId && (completedSession.mood || completedSession.achievements || completedSession.challenges)) {
          const reflectionData = {
            moodScore: completedSession.mood || 3,
            achievements: completedSession.achievements || '',
            challenges: completedSession.challenges || '',
            additionalNotes: undefined,
          };
          await saveReflection(mainSessionId, reflectionData);
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
      
      // localStorageからセッション状態を削除
      if (mainSessionId) {
        clearSessionStateFromStorage(mainSessionId)
      }

      // セッション終了時にアプリ起動フラグをクリア（次回起動時に自動遷移を有効にする）
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('app-started')
      }
      
      return mainSessionId
    } catch (error) {
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