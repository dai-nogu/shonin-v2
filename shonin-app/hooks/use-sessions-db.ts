"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
  
  // アンマウント後のsetState防止フラグ（フック全体で使用）
  const mountedRef = useRef(true)
  // レースコンディション対策：最新リクエストのみ反映
  const requestIdRef = useRef(0)

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
  // setErrorは安定した参照なので依存配列から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname, t])

  // セッションを取得（アクティビティ情報とタグも含む）- 復号化ビューを使用
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchSessions = useCallback(async (isRefreshing: boolean = false) => {
    // レースコンディション対策：リクエストIDを生成
    const currentRequestId = ++requestIdRef.current
    
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return
      setError(null)
      
      // リフレッシュ時はローディング表示なし、通常時は表示
      if (!mountedRef.current) return
      setLoading(!isRefreshing)

      if (!user?.id) {
        if (!mountedRef.current) return
        setSessions([])
        if (!mountedRef.current) return
        setLoading(false)
        return
      }

      const result = await sessionsActions.getSessions()
      
      // 古いリクエストの結果は無視（レースコンディション対策）
      if (currentRequestId !== requestIdRef.current) return
      if (!mountedRef.current) return
      
      if (result.success) {
        setSessions(result.data)
      } else {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'SESSION_FETCH_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'sessions.fetch_error')
          setError(t(errorKey))
        }
      }
    } finally {
      if (!mountedRef.current) return
      setLoading(false)
    }
  }, [user?.id, router, pathname, t])

  // セッションを追加
  const addSession = useCallback(async (session: Omit<SessionInsert, 'user_id'>, skipRefetch: boolean = false): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await sessionsActions.addSession(session)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'SESSION_ADD_FAILED', 'sessions.add_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'sessions.add_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }

      // skipRefetchがfalseの場合のみリストを更新（バックグラウンド）
      if (!skipRefetch) {
        fetchSessions(true)
      }
      return success(result.data)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'sessions.add_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }, [fetchSessions, user?.id, handleError, t, router, pathname])

  // セッションを更新
  const updateSession = useCallback(async (id: string, updates: SessionUpdate, skipRefetch: boolean = false): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }
      
      const result = await sessionsActions.updateSession(id, updates)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'SESSION_UPDATE_FAILED', 'sessions.update_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'sessions.update_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }

      // skipRefetchがfalseの場合のみリストを更新（バックグラウンド）
      if (!skipRefetch) {
        fetchSessions(true)
      }
      
      return success(undefined)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'sessions.update_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }, [fetchSessions, handleError, t, user?.id, router, pathname])

  // セッションを削除
  const deleteSession = useCallback(async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }
      
      const result = await sessionsActions.deleteSession(id)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'SESSION_DELETE_FAILED', 'sessions.delete_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'sessions.delete_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }

      // リストを更新（バックグラウンド、非同期で実行、エラーは無視）
      fetchSessions(true)
      return success(undefined)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'sessions.delete_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }, [fetchSessions, handleError, t, user?.id, router, pathname])

  // 期間指定でセッションを取得
  const getSessionsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<SessionWithActivity[]> => {
    // 新規操作開始時に古いエラーをクリア
    if (!mountedRef.current) return []
    setError(null)
    
    if (!user?.id) {
      return []
    }

    const result = await sessionsActions.getSessionsByDateRange(startDate, endDate)
    
    if (!mountedRef.current) return []
    
    if (result.success) {
      return result.data
    } else {
      // 認証エラーの場合はリダイレクト
      const code = result.code || 'SESSION_FETCH_FAILED'
      if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
        redirectToLogin(router, pathname)
      } else {
        // その他のエラーは setError で表示
        const errorKey = getErrorTranslationKey(code, 'sessions.fetch_period_error')
        setError(t(errorKey))
      }
      return []
    }
  }, [user?.id, router, pathname, t])

  // アクティビティ別の統計を取得
  const getActivityStats = useCallback(async (): Promise<ActivityStat[]> => {
    // 新規操作開始時に古いエラーをクリア
    if (!mountedRef.current) return []
    setError(null)
    
    if (!user?.id) {
      return []
    }

    const result = await sessionsActions.getActivityStats()
    
    if (!mountedRef.current) return []
    
    if (result.success) {
      return result.data
    } else {
      // 認証エラーの場合はリダイレクト
      const code = result.code || 'SESSION_FETCH_FAILED'
      if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
        redirectToLogin(router, pathname)
      } else {
        // その他のエラーは setError で表示
        const errorKey = getErrorTranslationKey(code, 'sessions.fetch_stats_error')
        setError(t(errorKey))
      }
      return []
    }
  }, [user?.id, router, pathname, t])

  // アンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialSessions = async () => {
      // レースコンディション対策：リクエストIDを生成
      const currentRequestId = ++requestIdRef.current
      
      try {
        if (isMounted && mountedRef.current) {
          setLoading(true)
        }

        if (!user?.id) {
          if (isMounted && mountedRef.current) {
            setSessions([])
            setLoading(false)
          }
          return
        }

        const result = await sessionsActions.getSessions()
        
        // 古いリクエストの結果は無視（レースコンディション対策）
        if (currentRequestId !== requestIdRef.current) return
        // アンマウント済みの場合はsetStateしない
        if (!isMounted || !mountedRef.current) return
        
        if (result.success) {
          setSessions(result.data)
        } else {
          // 認証エラーの場合はリダイレクト
          const code = result.code || 'SESSION_FETCH_FAILED'
          if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
            redirectToLogin(router, pathname)
          } else {
            // その他のエラーは setError で表示
            const errorKey = getErrorTranslationKey(code, 'sessions.fetch_error')
            setError(t(errorKey))
          }
        }
      } finally {
        // マウント中の場合のみsetLoadingを実行（アンマウント後のsetState防止）
        if (isMounted && mountedRef.current) {
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