"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
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

// 個別の目標を取得するフック
export function useSingleGoal(goalId: string) {
  const { user } = useAuth()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user?.id || !goalId) {
        setGoal(null)
        setLoading(false)
        return
      }

      try {
        const data = await goalsActions.getGoal(goalId)
        setGoal(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '目標の取得に失敗しました')
        setGoal(null)
      } finally {
        setLoading(false)
      }
    }

    fetchGoal()
  }, [user?.id, goalId])

  return { goal, loading, error }
}

export function useGoalsDb() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 目標を取得
  const fetchGoals = async (forceLoading: boolean = false) => {
    try {
      if (forceLoading) {
        setLoading(true)
      }

      if (!user?.id) {
        setGoals([])
        if (forceLoading) {
          setLoading(false)
        }
        return
      }

      const data = await goalsActions.getGoals()
      setGoals(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 目標を追加
  const addGoal = async (goalData: GoalFormData): Promise<string | null> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return null
      }

      const goalId = await goalsActions.addGoal(goalData)
      await fetchGoals() // リストを更新
      return goalId
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の追加に失敗しました')
      return null
    }
  }

  // 目標を更新
  const updateGoal = async (id: string, goalData: Partial<GoalFormData>): Promise<boolean> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return false
      }

      const success = await goalsActions.updateGoal(id, goalData)
      if (success) {
        await fetchGoals() // リストを更新
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の更新に失敗しました')
      return false
    }
  }

  // 目標を削除
  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return false
      }

      const success = await goalsActions.deleteGoal(id)
      if (success) {
        await fetchGoals() // リストを更新
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の削除に失敗しました')
      return false
    }
  }

  // 目標を完了に設定
  const completeGoal = async (id: string): Promise<boolean> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return false
      }

      const success = await goalsActions.completeGoal(id)
      if (success) {
        await fetchGoals() // リストを更新
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の完了に失敗しました')
      return false
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

  // 初回読み込み
  useEffect(() => {
    if (user?.id) {
      fetchGoals()
    }
  }, [user?.id])

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