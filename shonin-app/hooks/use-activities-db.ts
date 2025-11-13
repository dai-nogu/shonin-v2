"use client"

import { useState, useEffect } from 'react'
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

  // 認証エラーをハンドリングする共通関数（型安全 & replace & ループ対策）
  const handleError = (err: unknown, fallbackKey?: string): boolean => {
    // 認証エラーの場合は安全にリダイレクト
    if (isAuthError(err)) {
      redirectToLogin(router, pathname)
      return true
    }
    
    // その他のエラーの場合は多言語対応メッセージを設定
    const errorKey = getErrorTranslationKey(err, fallbackKey)
    setError(t(errorKey))
    return false
  }

  // アクティビティを取得
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchActivities = async (isRefreshing: boolean = false) => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      // リフレッシュ時はローディング表示なし、通常時は表示
      setLoading(!isRefreshing)

      if (!user?.id) {
        setActivities([])
        setLoading(false)
        return
      }

      const data = await activitiesActions.getActivities()
      setActivities(data || [])
    } catch (err) {
      handleError(err, 'activities.fetch_error')
    } finally {
      setLoading(false)
    }
  }

  // アクティビティを追加
  const addActivity = async (activity: Omit<ActivityInsert, 'user_id'>): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const activityId = await activitiesActions.addActivity(activity)
      await fetchActivities(true) // リストを更新（バックグラウンド）
      return success(activityId)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'activities.add_error')
      const errorMsg = t(errorKey)
      handleError(err, 'activities.add_error')
      return failure(errorMsg)
    }
  }

  // アクティビティを更新
  const updateActivity = async (id: string, updates: ActivityUpdate): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      const updated = await activitiesActions.updateActivity(id, updates)
      if (updated) {
        await fetchActivities(true) // リストを更新（バックグラウンド）
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'activities.update_error')
      const errorMsg = t(errorKey)
      handleError(err, 'activities.update_error')
      return failure(errorMsg)
    }
  }

  // アクティビティを削除
  const deleteActivity = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      const deleted = await activitiesActions.deleteActivity(id)
      if (deleted) {
        await fetchActivities(true) // リストを更新（バックグラウンド）
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'activities.delete_error')
      const errorMsg = t(errorKey)
      handleError(err, 'activities.delete_error')
      return failure(errorMsg)
    }
  }

  // アクティビティを取得（ID指定）
  const getActivity = (id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id)
  }

  // 初回読み込み
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialActivities = async () => {
      if (!user?.id) return
      
      try {
        if (isMounted) {
          setLoading(true)
        }

        const data = await activitiesActions.getActivities()
        
        // アンマウント済みの場合はsetStateしない
        if (!isMounted) return
        
        setActivities(data || [])
      } catch (err) {
        // アンマウント済みの場合は何もしない
        if (!isMounted) return
        
        handleError(err, 'activities.fetch_error')
      } finally {
        // アンマウント済みの場合のみsetLoadingを実行
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadInitialActivities()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id])

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