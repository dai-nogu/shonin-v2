"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { isAuthError, getErrorTranslationKey, redirectToLogin } from '@/lib/client-error-handler'
import * as goalsActions from '@/app/actions/goals'

type Goal = Database['public']['Tables']['goals']['Row']

// フォームからのデータ型（Server Actionsと同じ型を使用）
export interface GoalFormData {
  title: string
  motivation: string
  deadline: string
  weekdayHours: number
  weekendHours: number
  calculatedHours: number
  addDuration?: number // 進捗更新用：追加する時間（秒単位）
}

/**
 * 共通のエラーハンドリングを行うフック
 * 認証エラーの自動リダイレクトと多言語対応エラーメッセージの設定を一元化
 */
function useGoalsErrorHandler(setError: (error: string | null) => void) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()

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
  }, [router, pathname, t, setError])

  return handleError
}

// 個別の目標を取得するフック
export function useSingleGoal(goalId: string) {
  const { user } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 共通のエラーハンドラーを使用
  const handleError = useGoalsErrorHandler(setError)

  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const fetchGoal = async () => {
      if (!user?.id || !goalId) {
        if (isMounted) {
          setGoal(null)
          setLoading(false)
        }
        return
      }

      try {
        const data = await goalsActions.getGoal(goalId)
        // アンマウント済みの場合はsetStateしない
        if (!isMounted) return
        setGoal(data)
      } catch (err) {
        // アンマウント済みの場合は何もしない
        if (!isMounted) return
        
        // 共通のエラーハンドラーで処理（認証エラー自動リダイレクト + 多言語対応）
        handleError(err, 'goals.fetch_error')
        setGoal(null)
      } finally {
        // アンマウント済みの場合のみsetLoadingを実行
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchGoal()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, goalId, handleError])

  return { goal, loading, error }
}

export function useGoalsDb(initialGoals?: Goal[]) {
  const { user } = useAuth()
  const t = useTranslations()
  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? [])
  const [loading, setLoading] = useState(!initialGoals)
  const [error, setError] = useState<string | null>(null)

  // 共通のエラーハンドラーを使用
  const handleError = useGoalsErrorHandler(setError)

  // 目標を取得
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchGoals = async (isRefreshing: boolean = false) => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      // リフレッシュ時はローディング表示なし、通常時は表示
      setLoading(!isRefreshing)

      if (!user?.id) {
        setGoals([])
        setLoading(false)
        return
      }

      const data = await goalsActions.getGoals()
      setGoals(data || [])
    } catch (err) {
      // エラーハンドリング（認証エラーは自動リダイレクト、その他は多言語対応メッセージ）
      handleError(err, 'goals.fetch_error')
    } finally {
      setLoading(false)
    }
  }

  // 目標を追加
  const addGoal = async (goalData: GoalFormData): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const goalId = await goalsActions.addGoal(goalData)
      await fetchGoals(true) // リストを更新（バックグラウンド）
      return success(goalId)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'goals.add_error')
      const errorMsg = t(errorKey)
      handleError(err, 'goals.add_error')
      return failure(errorMsg)
    }
  }

  // 目標を更新
  const updateGoal = async (id: string, goalData: Partial<GoalFormData>): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const updated = await goalsActions.updateGoal(id, goalData)
      if (updated) {
        await fetchGoals(true) // リストを更新（バックグラウンド）
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'goals.update_error')
      const errorMsg = t(errorKey)
      handleError(err, 'goals.update_error')
      return failure(errorMsg)
    }
  }

  // 目標を削除
  const deleteGoal = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const deleted = await goalsActions.deleteGoal(id)
      if (deleted) {
        await fetchGoals(true) // リストを更新（バックグラウンド）
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'goals.delete_error')
      const errorMsg = t(errorKey)
      handleError(err, 'goals.delete_error')
      return failure(errorMsg)
    }
  }

  // 目標を完了に設定
  const completeGoal = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      setError(null)
      
      if (!user?.id) {
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const completed = await goalsActions.completeGoal(id)
      if (completed) {
        await fetchGoals(true) // リストを更新（バックグラウンド）
      }
      return success(undefined)
    } catch (err) {
      const errorKey = getErrorTranslationKey(err, 'goals.complete_error')
      const errorMsg = t(errorKey)
      handleError(err, 'goals.complete_error')
      return failure(errorMsg)
    }
  }

  // 目標を取得（ID指定）
  const getGoal = (id: string): Goal | undefined => {
    return goals.find(goal => goal.id === id)
  }

  // アクティブな目標を取得
  const getActiveGoals = (): Goal[] => {
    return goals.filter(goal => goal.status === 'active')
  }

  // 初回読み込み（初期データがない場合のみ）
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialGoals = async () => {
      if (!user?.id || initialGoals) return
      
      try {
        if (isMounted) {
          setLoading(true)
        }
        
        const data = await goalsActions.getGoals()
        
        // アンマウント済みの場合はsetStateしない
        if (!isMounted) return
        
        setGoals(data || [])
      } catch (err) {
        // アンマウント済みの場合は何もしない
        if (!isMounted) return
        
        handleError(err, 'goals.fetch_error')
      } finally {
        // アンマウント済みの場合のみsetLoadingを実行
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadInitialGoals()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, initialGoals])

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    getGoal,
    getActiveGoals,
    refetch: fetchGoals,
  }
} 