'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

// Supabaseクライアントを作成する共通関数
async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// ユーザー認証を確認する共通関数
async function getCurrentUser() {
  const supabase = await getSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('ログインが必要です')
  }
  
  return user
}

// 目標を取得
export async function getGoals(): Promise<Goal[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('目標の取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の取得に失敗しました')
  }
}

// 単一の目標を取得
export async function getGoal(goalId: string): Promise<Goal | null> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // データが見つからない場合
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('目標の取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の取得に失敗しました')
  }
}

// 目標を追加
export async function addGoal(goalData: GoalFormData): Promise<string> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

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

    const { data, error } = await supabase
      .from('goals')
      .insert({
        ...goalInsert,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return data.id
  } catch (error) {
    console.error('目標の追加に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の追加に失敗しました')
  }
}

// 目標を更新
export async function updateGoal(id: string, goalData: Partial<GoalFormData>): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()
    
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

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    console.error('目標の更新に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の更新に失敗しました')
  }
}

// 目標の進捗を更新（時間を加算）
export async function updateGoalProgress(id: string, additionalSeconds: number): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

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

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    console.error('目標進捗の更新に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標進捗の更新に失敗しました')
  }
}

// 目標を削除
export async function deleteGoal(id: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    console.error('目標の削除に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の削除に失敗しました')
  }
}

// 目標を完了に設定
export async function completeGoal(id: string): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('goals')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    console.error('目標の完了に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '目標の完了に失敗しました')
  }
}

// アクティブな目標を取得
export async function getActiveGoals(): Promise<Goal[]> {
  try {
    const goals = await getGoals()
    return goals.filter(goal => goal.status === 'active')
  } catch (error) {
    console.error('アクティブな目標の取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'アクティブな目標の取得に失敗しました')
  }
} 