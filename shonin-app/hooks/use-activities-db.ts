"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { isAuthError, getErrorTranslationKey, redirectToLogin } from '@/lib/client-error-handler'
import * as activitiesActions from '@/app/actions/activities'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

export function useActivitiesDb() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const [activities, setActivities] = useState<Activity[]>([])
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
  }, [router, pathname, t])

  // アクティビティを取得
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchActivities = async (isRefreshing: boolean = false) => {
    // レースコンディション対策：リクエストIDを生成
    const currentRequestId = ++requestIdRef.current
    
    // 新規操作開始時に古いエラーをクリア
    if (!mountedRef.current) return
    setError(null)
    
    // リフレッシュ時はローディング表示なし、通常時は表示
    if (!mountedRef.current) return
    setLoading(!isRefreshing)

    if (!user?.id) {
      if (!mountedRef.current) return
      setActivities([])
      if (!mountedRef.current) return
      setLoading(false)
      return
    }

    const result = await activitiesActions.getActivities()
    
    // 古いリクエストの結果は無視（レースコンディション対策）
    if (currentRequestId !== requestIdRef.current) return
    if (!mountedRef.current) return
    
    if (result.success) {
      setActivities(result.data)
    } else {
      // 認証エラーの場合はリダイレクト
      const code = result.code || 'ACTIVITY_FETCH_FAILED'
      if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
        redirectToLogin(router, pathname)
      } else {
        // その他のエラーは setError で表示
        const errorKey = getErrorTranslationKey(code, 'activities.fetch_error')
        setError(t(errorKey))
      }
    }
    
    if (!mountedRef.current) return
    setLoading(false)
  }

  // アクティビティを追加
  const addActivity = async (activity: Omit<ActivityInsert, 'user_id'>): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await activitiesActions.addActivity(activity)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'ACTIVITY_ADD_FAILED', 'activities.add_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'activities.add_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }
      
      await fetchActivities(true) // リストを更新（バックグラウンド）
      return success(result.data)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'activities.add_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // アクティビティを更新
  const updateActivity = async (id: string, updates: ActivityUpdate): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }
      
      const result = await activitiesActions.updateActivity(id, updates)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'ACTIVITY_UPDATE_FAILED', 'activities.update_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'activities.update_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }
      
      await fetchActivities(true) // リストを更新（バックグラウンド）
      return success(undefined)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'activities.update_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // アクティビティを削除
  const deleteActivity = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }
      
      const result = await activitiesActions.deleteActivity(id)
      
      if (!result.success) {
        // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
        const isAuthErr = handleError(result.code || 'ACTIVITY_DELETE_FAILED', 'activities.delete_error')
        if (isAuthErr) {
          return failure('Redirecting to login...', 'AUTH_REQUIRED')
        }
        
        // その他のエラーは failure のみ返す（UIで表示）
        const errorKey = getErrorTranslationKey(result.code, 'activities.delete_error')
        const errorMsg = t(errorKey)
        return failure(errorMsg)
      }
      
      await fetchActivities(true) // リストを更新（バックグラウンド）
      return success(undefined)
    } catch (err) {
      // 予期しないエラー
      const errorKey = getErrorTranslationKey(err, 'activities.delete_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // アクティビティを取得（ID指定）
  const getActivity = (id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id)
  }

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
    
    const loadInitialActivities = async () => {
      if (!user?.id) return
      
      // レースコンディション対策：リクエストIDを生成
      const currentRequestId = ++requestIdRef.current
      
      if (isMounted && mountedRef.current) {
        setLoading(true)
      }

      const result = await activitiesActions.getActivities()
      
      // 古いリクエストの結果は無視（レースコンディション対策）
      if (currentRequestId !== requestIdRef.current) return
      // アンマウント済みの場合はsetStateしない
      if (!isMounted || !mountedRef.current) return
      
      if (result.success) {
        setActivities(result.data)
      } else {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'ACTIVITY_FETCH_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'activities.fetch_error')
          setError(t(errorKey))
        }
      }
      
      // マウント中の場合のみsetLoadingを実行（アンマウント後のsetState防止）
      if (isMounted && mountedRef.current) {
        setLoading(false)
      }
    }
    
    loadInitialActivities()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, handleError])

  return {
    activities,
    loading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivity,
    refetch: fetchActivities,
  }
} 