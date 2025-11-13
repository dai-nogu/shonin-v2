"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { isAuthError, getErrorTranslationKey, redirectToLogin } from '@/lib/client-error-handler'
import * as sessionsActions from '@/app/actions/sessions'
import type { ActivityStat } from '@/app/actions/sessions'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export interface SessionWithActivity extends Session {
  activities?: {
    name: string
    icon: string | null
    color: string
  }
}

export function useSessionsDb() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const [sessions, setSessions] = useState<SessionWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 認証エラーをハンドリングする共通関数（型安全 & replace & ループ対策）
  const handleError = useCallback((err: unknown, fallbackKey?: string): boolean => {
    // 認証エラーの場合は安全にリダイレクト
    if (isAuthError(err)) {
      redirectToLogin(router, pathname)
      return true
    }
    
    // その他のエラーの場合は多言語対応メッセージを設定
    const errorKey = getErrorTranslationKey(err, fallbackKey)
    setError(t(errorKey))
    return false
  }, [router, pathname, t])

  // セッションを取得（アクティビティ情報とタグも含む）- 復号化ビューを使用
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchSessions = useCallback(async (isRefreshing: boolean = false) => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      // リフレッシュ時はローディング表示なし、通常時は表示
      setLoading(!isRefreshing)

      if (!user?.id) {
        setSessions([])
        setLoading(false)
        return
      }

      const data = await sessionsActions.getSessions()
      setSessions(data || [])
    } catch (err) {
      handleError(err, 'sessions.fetch_error')
    } finally {
      setLoading(false)
    }
  }, [user?.id, handleError])

  // セッションを追加
  const addSession = useCallback(async (session: Omit<SessionInsert, 'user_id'>, skipRefetch: boolean = false): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const sessionId = await sessionsActions.addSession(session)

      // skipRefetchがfalseの場合のみリストを更新（バックグラウンド）
      if (!skipRefetch) {
        fetchSessions(true)
      }
      return success(sessionId)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'sessions.add_error')
      const errorMsg = t(errorKey)
      handleError(err, 'sessions.add_error')
      return failure(errorMsg)
    }
  }, [fetchSessions, user?.id, handleError, t])

  // セッションを更新
  const updateSession = useCallback(async (id: string, updates: SessionUpdate, skipRefetch: boolean = false): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      const updated = await sessionsActions.updateSession(id, updates)

      // skipRefetchがfalseの場合のみリストを更新（バックグラウンド）
      if (!skipRefetch && updated) {
        fetchSessions(true)
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'sessions.update_error')
      const errorMsg = t(errorKey)
      handleError(err, 'sessions.update_error')
      return failure(errorMsg)
    }
  }, [fetchSessions, handleError, t])

  // セッションを削除
  const deleteSession = useCallback(async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      const deleted = await sessionsActions.deleteSession(id)

      // リストを更新（バックグラウンド、非同期で実行、エラーは無視）
      if (deleted) {
        fetchSessions(true)
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'sessions.delete_error')
      const errorMsg = t(errorKey)
      handleError(err, 'sessions.delete_error')
      return failure(errorMsg)
    }
  }, [fetchSessions, handleError, t])

  // 期間指定でセッションを取得
  const getSessionsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<SessionWithActivity[]> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        return []
      }

      return await sessionsActions.getSessionsByDateRange(startDate, endDate)
    } catch (err) {
      handleError(err, 'sessions.fetch_period_error')
      return []
    }
  }, [user?.id, handleError])

  // アクティビティ別の統計を取得
  const getActivityStats = useCallback(async (): Promise<ActivityStat[]> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        return []
      }

      return await sessionsActions.getActivityStats()
    } catch (err) {
      handleError(err, 'sessions.fetch_stats_error')
      return []
    }
  }, [user?.id, handleError])

  // 初回読み込み
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialSessions = async () => {
      try {
        if (isMounted) {
          setLoading(true)
        }

        if (!user?.id) {
          if (isMounted) {
            setSessions([])
            setLoading(false)
          }
          return
        }

        const data = await sessionsActions.getSessions()
        
        // アンマウント済みの場合はsetStateしない
        if (!isMounted) return
        
        setSessions(data || [])
      } catch (err) {
        // アンマウント済みの場合は何もしない
        if (!isMounted) return
        
        handleError(err, 'sessions.fetch_error')
      } finally {
        // アンマウント済みの場合のみsetLoadingを実行
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadInitialSessions()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, handleError])

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    getSessionsByDateRange,
    getActivityStats,
    refetch: fetchSessions,
  }
} 