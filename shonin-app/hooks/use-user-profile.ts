import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'

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

      const userId = user.id

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // プロフィールが存在しない場合は新規作成
        if (error.code === 'PGRST116') {
          const newProfile: Database['public']['Tables']['users']['Insert'] = {
            id: userId,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            timezone: 'Asia/Tokyo'
          }

          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(newProfile)
            .select()
            .single()

          if (insertError) {
            console.error('Profile creation error:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            throw insertError
          }

          setProfile(insertData)
        } else {
          console.error('Profile fetch error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error in fetchProfile:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        userId: user?.id || 'No user ID'
      })
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

      const userId = user.id

      // 更新日時を追加
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (error) {
        console.error('Profile update error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          updateData
        })
        throw error
      }

      // プロフィールを再取得して状態を更新
      await fetchProfile()
      return true
    } catch (err) {
      console.error('Error in updateProfile:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        userId: user?.id || 'No user ID'
      })
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