"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import * as userProfileActions from '@/app/actions/user-profile'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // プロフィールを取得
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // ログインしていない場合は処理を終了
      if (!user?.id) {
        setProfile(null)
        setLoading(false)
        return
      }

      const data = await userProfileActions.getProfile()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user])

  // プロフィールを更新
  const updateProfile = useCallback(async (updates: Partial<UserProfileUpdate>): Promise<boolean> => {
    try {
      setError(null)

      // ログインしていない場合は処理を終了
      if (!user?.id) {
        setError('ログインが必要です')
        return false
      }

      const success = await userProfileActions.updateProfile(updates)

      // プロフィールを再取得して状態を更新
      if (success) {
        await fetchProfile()
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました')
      return false
    }
  }, [fetchProfile, user])

  // ユーザー名を更新
  const updateUserName = useCallback(async (name: string): Promise<boolean> => {
    return await updateProfile({ name })
  }, [updateProfile])

  // タイムゾーンを更新
  const updateTimezone = useCallback(async (timezone: string): Promise<boolean> => {
    return await updateProfile({ timezone })
  }, [updateProfile])

  // 初期化
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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