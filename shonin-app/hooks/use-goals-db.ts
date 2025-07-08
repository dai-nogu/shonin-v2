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
  const fetchGoals = async (forceLoading = false) => {
    try {
      // データが既に存在する場合はローディング状態をスキップ
      if (forceLoading || goals.length === 0) {
        setLoading(true)
      }
      console.log('Fetching goals...')
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', DUMMY_USER_ID)
        .order('created_at', { ascending: false })

      console.log('Goals response:', { data, error })

      if (error) {
        console.error('Goals fetch error:', error)
        throw error
      }

      setGoals(data || [])
      console.log('Goals loaded:', data?.length || 0)
    } catch (err) {
      console.error('Error in fetchGoals:', err)
      setError(err instanceof Error ? err.message : '目標の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 目標を追加
  const addGoal = async (goalData: GoalFormData): Promise<string | null> => {
    try {
      console.log('Adding goal:', goalData)

      // フォームデータをデータベース形式に変換
      const goalInsert: Omit<GoalInsert, 'user_id'> = {
        title: goalData.title,
        description: goalData.motivation,
        target_duration: goalData.calculatedHours * 3600, // 時間を秒に変換
        deadline: goalData.deadline,
        is_completed: false,
        weekday_hours: goalData.weekdayHours,
        weekend_hours: goalData.weekendHours,
        current_value: 0,
        unit: '時間',
        status: 'active',
      }

      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalInsert,
          user_id: DUMMY_USER_ID,
        })
        .select('id')
        .single()

      console.log('Goal insert response:', { data, error })

      if (error) {
        console.error('Goal insert error:', error)
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
      console.log('Goal added successfully:', data.id)
      return data.id
    } catch (err) {
      console.error('Error in addGoal:', err)
      setError(err instanceof Error ? err.message : '目標の追加に失敗しました')
      return null
    }
  }

  // 目標を更新
  const updateGoal = async (id: string, goalData: GoalFormData): Promise<boolean> => {
    try {
      console.log('Updating goal:', id, goalData)

      // 進捗更新の場合は別処理
      if (goalData.addDuration !== undefined) {
        console.log('進捗更新モードで処理します:', { goalId: id, addDuration: goalData.addDuration })
        return await updateGoalProgress(id, goalData.addDuration)
      }

      const goalUpdate: GoalUpdate = {
        title: goalData.title,
        description: goalData.motivation,
        target_duration: goalData.calculatedHours * 3600, // 時間を秒に変換
        deadline: goalData.deadline,
        weekday_hours: goalData.weekdayHours,
        weekend_hours: goalData.weekendHours,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('goals')
        .update(goalUpdate)
        .eq('id', id)

      if (error) {
        console.error('Goal update error:', error)
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
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
      console.log('Updating goal progress:', id, `+${additionalSeconds}秒`)

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
      console.log(`目標進捗を更新: ${currentGoal.current_value || 0}秒 → ${newCurrentValue}秒`)
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
      console.log('Deleting goal:', id)

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Goal delete error:', error)
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
      return true
    } catch (err) {
      console.error('Error in deleteGoal:', err)
      setError(err instanceof Error ? err.message : '目標の削除に失敗しました')
      return false
    }
  }

  // 目標を完了にする
  const completeGoal = async (id: string): Promise<boolean> => {
    try {
      console.log('Completing goal:', id)

      const { error } = await supabase
        .from('goals')
        .update({ 
          is_completed: true,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) {
        console.error('Goal complete error:', error)
        throw error
      }

      await fetchGoals(true) // リストを更新（強制ローディング）
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