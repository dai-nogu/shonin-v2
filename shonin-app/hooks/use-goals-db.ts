"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// フォームからのデータ型
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
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const fetchGoal = async () => {
      if (!user?.id || !goalId) {
        setGoal(null)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('id', goalId)
          .eq('user_id', user.id)
          .single()

        if (error) {
          throw error
        }

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
  const [supabase] = useState(() => createClient())

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

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }


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
      // calculatedHoursを秒に変換（時間 * 3600）
      const targetDurationSeconds = goalData.calculatedHours * 3600

      const goalInsert: Omit<GoalInsert, 'user_id'> = {
        title: goalData.title,
        description: goalData.motivation || null, // motivationをdescriptionにマッピング
        target_duration: targetDurationSeconds, // 秒単位で保存
        current_value: 0, // 初期値は0
        unit: '時間', // 固定値
        deadline: goalData.deadline || null,
        weekday_hours: goalData.weekdayHours || 0,
        weekend_hours: goalData.weekendHours || 0,
        status: 'active' as const, // 新規作成時は常にactive
      }



      if (!user?.id) {
        setError('ログインが必要です')
        return null
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalInsert,
          user_id: user.id,
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }


      await fetchGoals() // リストを更新
      return data.id
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
      
      // 進捗更新のためのaddDuration処理
      if ('addDuration' in goalData && typeof goalData.addDuration === 'number') {
        return await updateGoalProgress(id, goalData.addDuration)
      }

      // 通常の目標更新処理
      const updateData: Partial<GoalUpdate> = {}
      
      if (goalData.title !== undefined) updateData.title = goalData.title
      if (goalData.motivation !== undefined) updateData.description = goalData.motivation // motivationをdescriptionにマッピング
      if (goalData.calculatedHours !== undefined) updateData.target_duration = goalData.calculatedHours * 3600 // 時間を秒に変換
      if (goalData.deadline !== undefined) updateData.deadline = goalData.deadline
      if (goalData.weekdayHours !== undefined) updateData.weekday_hours = goalData.weekdayHours
      if (goalData.weekendHours !== undefined) updateData.weekend_hours = goalData.weekendHours

      // 更新日時を追加
      updateData.updated_at = new Date().toISOString()



      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }


      await fetchGoals() // リストを更新
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標の更新に失敗しました')
      return false
    }
  }

  // 目標の進捗を更新（時間を加算）
  const updateGoalProgress = async (id: string, additionalSeconds: number): Promise<boolean> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return false
      }

      // データベースから最新の目標を取得
      const { data: currentGoal, error: fetchError } = await supabase
        .from('goals')
        .select('current_value')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !currentGoal) {
        throw new Error('目標が見つかりません')
      }

      // 新しい進捗値を計算
      const newCurrentValue = (currentGoal.current_value || 0) + additionalSeconds

      const { error } = await supabase
        .from('goals')
        .update({
          current_value: newCurrentValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '目標進捗の更新に失敗しました')
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

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      await fetchGoals() // リストを更新
      return true
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

      const { error } = await supabase
        .from('goals')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      await fetchGoals() // リストを更新
      return true
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