"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  // setErrorは安定した参照なので依存配列から除外
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, pathname, t])

  return handleError
}

// 個別の目標を取得するフック
export function useSingleGoal(goalId: string) {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // アンマウント後のsetState防止フラグ（フック全体で使用）
  const mountedRef = useRef(true)
  
  // 共通のエラーハンドラーを使用（例外処理用）
  const handleError = useGoalsErrorHandler(setError)

  useEffect(() => {
    // マウント時に初期化、アンマウント時のクリーンアップ
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // アンマウント後のsetState防止フラグ（ローカル）
    let isMounted = true
    
    const fetchGoal = async () => {
      if (!user?.id || !goalId) {
        if (isMounted) {
          setGoal(null)
          setLoading(false)
        }
        return
      }

      const result = await goalsActions.getGoal(goalId)
      
      // アンマウント済みの場合はsetStateしない
      if (!isMounted) return
      
      if (result.success) {
        setGoal(result.data)
      } else {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_FETCH_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.fetch_error')
          setError(t(errorKey))
        }
        setGoal(null)
      }
      
      // マウント中の場合のみsetLoadingを実行（アンマウント後のsetState防止）
      if (isMounted) {
        setLoading(false)
      }
    }

    fetchGoal()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, goalId, router, pathname, t])

  return { goal, loading, error }
}

export function useGoalsDb(initialGoals?: Goal[]) {
  const { user } = useAuth()
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname()
  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? [])
  const [loading, setLoading] = useState(!initialGoals)
  const [error, setError] = useState<string | null>(null)
  
  // アンマウント後のsetState防止フラグ（フック全体で使用）
  const mountedRef = useRef(true)
  // レースコンディション対策：最新リクエストのみ反映
  const requestIdRef = useRef(0)

  // 共通のエラーハンドラーを使用（例外処理用）
  const handleError = useGoalsErrorHandler(setError)

  // 目標を取得
  // isRefreshing: true = バックグラウンド更新（ローディング表示なし）
  //               false = 初回読み込み/明示的リロード（ローディング表示あり）
  const fetchGoals = async (isRefreshing: boolean = false) => {
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
      setGoals([])
      if (!mountedRef.current) return
      setLoading(false)
      return
    }

    const result = await goalsActions.getGoals()
    
    // 古いリクエストの結果は無視（レースコンディション対策）
    if (currentRequestId !== requestIdRef.current) return
    if (!mountedRef.current) return
    
    if (result.success) {
      setGoals(result.data)
    } else {
      // 認証エラーの場合はリダイレクト
      const code = result.code || 'GOAL_FETCH_FAILED'
      if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
        redirectToLogin(router, pathname)
      } else {
        // その他のエラーは setError で表示
        const errorKey = getErrorTranslationKey(code, 'goals.fetch_error')
        setError(t(errorKey))
      }
    }
    
    if (!mountedRef.current) return
    setLoading(false)
  }

  // 目標を追加
  const addGoal = async (goalData: GoalFormData): Promise<Result<string>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await goalsActions.addGoal(goalData)
      
      if (!result.success) {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_ADD_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.add_error')
          setError(t(errorKey))
        }
        return result
      }
      
      await fetchGoals(true) // リストを更新（バックグラウンド）
      return result
    } catch (err) {
      // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
      const isAuthErr = handleError(err, 'goals.add_error')
      if (isAuthErr) {
        return failure('Redirecting to login...', 'AUTH_REQUIRED')
      }
      
      // その他のエラーは failure のみ返す（UIで表示）
      const errorKey = getErrorTranslationKey(err, 'goals.add_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // 目標を更新
  const updateGoal = async (id: string, goalData: Partial<GoalFormData>): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await goalsActions.updateGoal(id, goalData)
      if (!result.success) {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_UPDATE_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.update_error')
          setError(t(errorKey))
        }
        return result
      }
      
      await fetchGoals(true) // リストを更新（バックグラウンド）
      return result
    } catch (err) {
      // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
      const isAuthErr = handleError(err, 'goals.update_error')
      if (isAuthErr) {
        return failure('Redirecting to login...', 'AUTH_REQUIRED')
      }
      
      // その他のエラーは failure のみ返す（UIで表示）
      const errorKey = getErrorTranslationKey(err, 'goals.update_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // 目標を削除
  const deleteGoal = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await goalsActions.deleteGoal(id)
      
      if (!result.success) {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_DELETE_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.delete_error')
          setError(t(errorKey))
        }
        return result
      }
      
      await fetchGoals(true) // リストを更新（バックグラウンド）
      return result
    } catch (err) {
      // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
      const isAuthErr = handleError(err, 'goals.delete_error')
      if (isAuthErr) {
        return failure('Redirecting to login...', 'AUTH_REQUIRED')
      }
      
      // その他のエラーは failure のみ返す（UIで表示）
      const errorKey = getErrorTranslationKey(err, 'goals.delete_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // 目標を完了に設定
  const completeGoal = async (id: string): Promise<Result<void>> => {
    try {
      // 新規操作開始時に古いエラーをクリア
      if (!mountedRef.current) return failure('Component unmounted', 'UNMOUNTED')
      setError(null)
      
      if (!user?.id) {
        redirectToLogin(router, pathname)
        const errorMsg = t('errors.AUTH_REQUIRED')
        return failure(errorMsg, 'AUTH_REQUIRED')
      }

      const result = await goalsActions.completeGoal(id)
      if (!result.success) {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_COMPLETE_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.complete_error')
          setError(t(errorKey))
        }
        return result
      }
      
      await fetchGoals(true) // リストを更新（バックグラウンド）
      return result
    } catch (err) {
      // 認証エラーは handleError でリダイレクト（UIエラー表示なし）
      const isAuthErr = handleError(err, 'goals.complete_error')
      if (isAuthErr) {
        return failure('Redirecting to login...', 'AUTH_REQUIRED')
      }
      
      // その他のエラーは failure のみ返す（UIで表示）
      const errorKey = getErrorTranslationKey(err, 'goals.complete_error')
      const errorMsg = t(errorKey)
      return failure(errorMsg)
    }
  }

  // 目標を取得（ID指定）
  const getGoal = (id: string): Goal | undefined => {
    return goals.find(goal => goal.id === id)
  }

  // アクティブな目標を取得（パフォーマンス最適化のためuseMemo化）
  const getActiveGoals = useMemo((): Goal[] => {
    return goals.filter(goal => goal.status === 'active')
  }, [goals])

  // マウント時に初期化、アンマウント時のクリーンアップ
  useEffect(() => {
    mountedRef.current = true // マウント時に必ずtrueにする
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 初回読み込み（初期データがない場合のみ）
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const loadInitialGoals = async () => {
      if (!user?.id || initialGoals) return
      
      // レースコンディション対策：リクエストIDを生成
      const currentRequestId = ++requestIdRef.current
      
      if (isMounted && mountedRef.current) {
        setLoading(true)
      }
      
      const result = await goalsActions.getGoals()
      
      // 古いリクエストの結果は無視（レースコンディション対策）
      if (currentRequestId !== requestIdRef.current) return
      // アンマウント済みの場合はsetStateしない
      if (!isMounted || !mountedRef.current) return
      
      if (result.success) {
        setGoals(result.data)
      } else {
        // 認証エラーの場合はリダイレクト
        const code = result.code || 'GOAL_FETCH_FAILED'
        if (code === 'AUTH_REQUIRED' || code === 'AUTH_FAILED' || code === 'UNAUTHORIZED') {
          redirectToLogin(router, pathname)
        } else {
          // その他のエラーは setError で表示
          const errorKey = getErrorTranslationKey(code, 'goals.fetch_error')
          setError(t(errorKey))
        }
      }
      
      // マウント中の場合のみsetLoadingを実行（アンマウント後のsetState防止）
      if (isMounted && mountedRef.current) {
        setLoading(false)
      }
    }
    
    loadInitialGoals()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [user?.id, initialGoals, handleError])

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