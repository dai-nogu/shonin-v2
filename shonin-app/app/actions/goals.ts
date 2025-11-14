'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { getPlanLimits, type PlanType } from '@/types/subscription'
import { getSubscriptionInfo } from './subscription-info'
import { AppError, handleServerError, requireAuth, notFound, getErrorCode } from '@/lib/server-error'
import { safeError } from '@/lib/safe-logger'

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
    // サーバーログに詳細を記録
    safeError('認証エラー', error)
    // クライアントには安全なエラーコードのみ
    throw requireAuth()
  }
  
  return user
}

// 目標を取得
export async function getGoals(): Promise<Result<Goal[]>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      // サーバーログに詳細を記録
      safeError('目標取得エラー', { error, userId: user.id })
      // クライアントには安全なエラーコードのみ
      return failure('Failed to fetch goals', 'GOAL_FETCH_FAILED')
    }

    return success(data || [])
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to fetch goals', code || 'GOAL_FETCH_FAILED')
  }
}

// 単一の目標を取得
export async function getGoal(goalId: string): Promise<Result<Goal | null>> {
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
        // データが見つからない場合はnullを返す（エラーではない）
        return success(null)
      }
      // サーバーログに詳細を記録
      safeError('目標取得エラー', { error, goalId, userId: user.id })
      // クライアントには安全なエラーコードのみ
      return failure('Failed to fetch goal', 'GOAL_FETCH_FAILED')
    }

    return success(data)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to fetch goal', code || 'GOAL_FETCH_FAILED')
  }
}

// 目標を追加
export async function addGoal(goalData: GoalFormData): Promise<string> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    // プラン制限をチェック
    const subscriptionInfo = await getSubscriptionInfo()
    const planLimits = getPlanLimits(subscriptionInfo.subscriptionStatus)
    
    // 現在のアクティブな目標数を取得
    const { count: currentGoalCount, error: countError } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
    
    if (countError) {
      safeError('目標数取得エラー', { error: countError, userId: user.id })
      throw new AppError('GOAL_FETCH_FAILED')
    }
    
    // 上限チェック
    if (currentGoalCount !== null && currentGoalCount >= planLimits.maxGoals) {
      // サーバーログに記録
      safeError('目標数上限到達', { 
        userId: user.id, 
        currentCount: currentGoalCount, 
        limit: planLimits.maxGoals,
        plan: subscriptionInfo.subscriptionStatus 
      })
      // クライアントには安全なエラーコードのみ
      throw new AppError('GOAL_LIMIT_REACHED', 400)
    }

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

    if (error) {
      safeError('目標追加エラー', { error, userId: user.id })
      throw new AppError('GOAL_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return data.id
  } catch (error) {
    handleServerError(error, 'addGoal', 'GOAL_ADD_FAILED')
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

    if (error) {
      safeError('目標更新エラー', { error, goalId: id, userId: user.id })
      throw new AppError('GOAL_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    handleServerError(error, 'updateGoal', 'GOAL_UPDATE_FAILED')
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

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        safeError('目標が見つかりません', { goalId: id, userId: user.id })
        throw new AppError('GOAL_NOT_FOUND', 404)
      }
      safeError('目標取得エラー', { error: fetchError, goalId: id, userId: user.id })
      throw new AppError('GOAL_FETCH_FAILED')
    }

    if (!currentGoal) {
      safeError('目標が見つかりません', { goalId: id, userId: user.id })
      throw new AppError('GOAL_NOT_FOUND', 404)
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
      safeError('目標進捗更新エラー', { error, goalId: id, userId: user.id })
      throw new AppError('GOAL_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    handleServerError(error, 'updateGoalProgress', 'GOAL_UPDATE_FAILED')
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

    if (error) {
      safeError('目標削除エラー', { error, goalId: id, userId: user.id })
      throw new AppError('GOAL_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    handleServerError(error, 'deleteGoal', 'GOAL_DELETE_FAILED')
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

    if (error) {
      safeError('目標完了エラー', { error, goalId: id, userId: user.id })
      throw new AppError('GOAL_COMPLETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    handleServerError(error, 'completeGoal', 'GOAL_COMPLETE_FAILED')
  }
}

// アクティブな目標を取得
export async function getActiveGoals(): Promise<Goal[]> {
  try {
    const goals = await getGoals()
    return goals.filter(goal => goal.status === 'active')
  } catch (error) {
    handleServerError(error, 'getActiveGoals', 'GOAL_FETCH_FAILED')
  }
} 