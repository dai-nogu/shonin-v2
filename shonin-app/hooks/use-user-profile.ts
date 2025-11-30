"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { isAuthError, getErrorTranslationKey, redirectToLogin } from '@/lib/client-error-handler'
import * as userProfileActions from '@/app/actions/user-profile'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

export function useUserProfile() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const [profile, setProfile] = useState<UserProfile | null>(null)
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

  // プロフィールを取得
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchProfile = useCallback(async (isRefreshing: boolean = false) => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      // リフレッシュ時はローディング表示なし、通常時は表示
      setLoading(!isRefreshing)

      // ログインしていない場合は処理を終了
      if (!user?.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      const data = await userProfileActions.getProfile()
      setProfile(data)
    } catch (err) {
      handleError(err, 'profile.fetch_error')
    } finally {
      setLoading(false)
    }
  }, [user, handleError])

  // プロフィールを更新
  const updateProfile = useCallback(async (updates: Partial<UserProfileUpdate>): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア（updateProfile内で既に実行済み）
      setError(null)

      // ログインしていない場合は処理を終了
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const updated = await userProfileActions.updateProfile(updates)

      // プロフィールを再取得して状態を更新（バックグラウンド）
      if (updated) {
        await fetchProfile(true)
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'profile.update_error')
      const errorMsg = t(errorKey)
      handleError(err, 'profile.update_error')
      return failure(errorMsg)
    }
  }, [fetchProfile, user, handleError, t])

  // ユーザー名を更新
  const updateUserName = useCallback(async (name: string): Promise<Result<void>> => {
    return await updateProfile({ name })
  }, [updateProfile])

  // タイムゾーンを更新
  const updateTimezone = useCallback(async (timezone: string): Promise<Result<void>> => {
    return await updateProfile({ timezone })
  }, [updateProfile])

  // 初期化
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialProfile = async () => {
      try {
        if (isMounted) {
          setLoading(true)
          setError(null)
        }

        // ログインしていない場合は処理を終了
        if (!user?.id) {
          if (isMounted) {
            setProfile(null)
            setLoading(false)
          }
          return
        }

        const data = await userProfileActions.getProfile()
        
        // アンマウント済みの場合はsetStateしない
        if (!isMounted) return
        
        setProfile(data)
      } catch (err) {
        // アンマウント済みの場合は何もしない
        if (!isMounted) return
        
        handleError(err, 'profile.fetch_error')
      } finally {
        // アンマウント済みの場合のみsetLoadingを実行
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadInitialProfile()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, handleError])

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    updateUserName,
    updateTimezone
  }
} 