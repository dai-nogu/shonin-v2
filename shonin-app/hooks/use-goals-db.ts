"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type GoalInsert = Database['public']['Tables']['goals']['Insert']
type GoalUpdate = Database['public']['Tables']['goals']['Update']

// テスト用のダミーユーザーID
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

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

export function useGoalsDb() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 目標を取得
  const fetchGoals = async (forceLoading: boolean = false) => {
    try {
      if (forceLoading) {
        setLoading(true)
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', DUMMY_USER_ID)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Goals fetch error:', error)
        throw error
      }

      setGoals(data || [])
    } catch (err) {
      console.error('Error in fetchGoals:', err)
      setError(err instanceof Error ? err.message : '目標の取得に失敗しました')
    } finally {
      if (forceLoading) {
        setLoading(false)
      }
    }
  }

  // 目標を追加
  const addGoal = async (goalData: GoalFormData): Promise<string | null> => {
    try {
      const goalInsert: Omit<GoalInsert, 'user_id'> = {
        title: goalData.title,
        description: goalData.description || null,
        target_duration: goalData.target_duration,
        current_value: goalData.current_value || 0,
        unit: goalData.unit || '時間',
        deadline: goalData.deadline || null,
        weekday_hours: goalData.weekday_hours || 0,
        weekend_hours: goalData.weekend_hours || 0,
        status: goalData.status || 'active',
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalInsert,
          user_id: DUMMY_USER_ID,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Goal insert error:', error)
        throw error
      }

      await fetchGoals() // リストを更新
      return data.id
    } catch (err) {
      console.error('Error in addGoal:', err)
      setError(err instanceof Error ? err.message : '目標の追加に失敗しました')
      return null
    }
  }

  // 目標を更新
  const updateGoal = async (id: string, goalData: Partial<GoalFormData>): Promise<boolean> => {
    try {
      // 進捗更新のためのaddDuration処理
      if ('addDuration' in goalData && typeof goalData.addDuration === 'number') {
        return await updateGoalProgress(id, goalData.addDuration)
      }

      // 通常の目標更新処理
      const updateData: Partial<GoalUpdate> = {}
      
      if (goalData.title !== undefined) updateData.title = goalData.title
      if (goalData.description !== undefined) updateData.description = goalData.description
      if (goalData.target_duration !== undefined) updateData.target_duration = goalData.target_duration
      if (goalData.current_value !== undefined) updateData.current_value = goalData.current_value
      if (goalData.unit !== undefined) updateData.unit = goalData.unit
      if (goalData.deadline !== undefined) updateData.deadline = goalData.deadline
      if (goalData.weekday_hours !== undefined) updateData.weekday_hours = goalData.weekday_hours
      if (goalData.weekend_hours !== undefined) updateData.weekend_hours = goalData.weekend_hours
      if (goalData.status !== undefined) updateData.status = goalData.status

      // 更新日時を追加
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('goals')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', DUMMY_USER_ID)

      if (error) {
        console.error('Goal update error:', error)
        throw error
      }

      await fetchGoals() // リストを更新
      return true
    } catch (err) {
      console.error('Error in updateGoal:', err)
      setError(err instanceof Error ? err.message : '目標の更新に失敗しました')
      return false
    }
  }

  // 目標の進捗を更新（時間を加算）
  const updateGoalProgress = async (id: string, additionalSeconds: number): Promise<boolean> => {
    try {
      // データベースから最新の目標を取得
      const { data: currentGoal, error: fetchError } = await supabase
        .from('goals')
        .select('current_value')
        .eq('id', id)
        .eq('user_id', DUMMY_USER_ID)
        .single()

      if (fetchError || !currentGoal) {
        console.error('Goal fetch error:', fetchError)
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
        .eq('user_id', DUMMY_USER_ID)

      if (error) {
        console.error('Goal progress update error:', error)
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
      return true
    } catch (err) {
      console.error('Error in updateGoalProgress:', err)
      setError(err instanceof Error ? err.message : '目標進捗の更新に失敗しました')
      return false
    }
  }

  // 目標を削除
  const deleteGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', DUMMY_USER_ID)

      if (error) {
        console.error('Goal delete error:', error)
        throw error
      }

      await fetchGoals() // リストを更新
      return true
    } catch (err) {
      console.error('Error in deleteGoal:', err)
      setError(err instanceof Error ? err.message : '目標の削除に失敗しました')
      return false
    }
  }

  // 目標を完了に設定
  const completeGoal = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', DUMMY_USER_ID)

      if (error) {
        console.error('Goal completion error:', error)
        throw error
      }

      await fetchGoals() // リストを更新
      return true
    } catch (err) {
      console.error('Error in completeGoal:', err)
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
    fetchGoals()
  }, [])

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