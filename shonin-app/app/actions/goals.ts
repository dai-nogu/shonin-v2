'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, ConstellationNode, ConstellationEdge, ConstellationData } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { getPlanLimits, type PlanType } from '@/types/subscription'
import { getSubscriptionInfo } from './subscription-info'
import { AppError, handleServerError, requireAuth, notFound, getErrorCode } from '@/lib/server-error'
import { safeError } from '@/lib/safe-logger'
import { JA_INPUT_LIMITS, truncateForDb, truncateRequiredForDb } from '@/lib/input-limits'

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
export async function addGoal(goalData: GoalFormData): Promise<Result<string>> {
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
      return failure('Failed to get goal count', 'GOAL_FETCH_FAILED')
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
      return failure('Goal limit reached', 'GOAL_LIMIT_REACHED')
    }

    // calculatedHoursを秒に変換（時間 * 3600）
    const targetDurationSeconds = goalData.calculatedHours * 3600

    // サーバー側で文字数制限を適用（UIバイパス対策）
    const goalInsert: Omit<GoalInsert, 'user_id'> = {
      title: truncateRequiredForDb(goalData.title, JA_INPUT_LIMITS.goalTitle),
      dont_list: goalData.motivation || null, // やめることリスト（JSON配列）
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
      return failure('Failed to add goal', 'GOAL_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return success(data.id)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to add goal', code || 'GOAL_ADD_FAILED')
  }
}

// 目標を更新
export async function updateGoal(id: string, goalData: Partial<GoalFormData>): Promise<Result<void>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()
    
    // 進捗更新のためのaddDuration処理
    if ('addDuration' in goalData && typeof goalData.addDuration === 'number') {
      const result = await updateGoalProgress(id, goalData.addDuration)
      return result
    }

    // 通常の目標更新処理（サーバー側で文字数制限を適用）
    const updateData: Partial<GoalUpdate> = {}
    
    if (goalData.title !== undefined) updateData.title = truncateRequiredForDb(goalData.title, JA_INPUT_LIMITS.goalTitle)
    if (goalData.motivation !== undefined) updateData.dont_list = goalData.motivation || null // やめることリスト（JSON配列）
    if (goalData.calculatedHours !== undefined) updateData.target_duration = goalData.calculatedHours * 3600 // 時間を秒に変換
    if (goalData.deadline !== undefined) updateData.deadline = goalData.deadline || null // 空文字列の場合はnullに変換
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
      return failure('Failed to update goal', 'GOAL_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to update goal', code || 'GOAL_UPDATE_FAILED')
  }
}

// 目標の進捗を更新（時間を加算）
export async function updateGoalProgress(id: string, additionalSeconds: number): Promise<Result<void>> {
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
        return failure('Goal not found', 'GOAL_NOT_FOUND')
      }
      safeError('目標取得エラー', { error: fetchError, goalId: id, userId: user.id })
      return failure('Failed to fetch goal', 'GOAL_FETCH_FAILED')
    }

    if (!currentGoal) {
      safeError('目標が見つかりません', { goalId: id, userId: user.id })
      return failure('Goal not found', 'GOAL_NOT_FOUND')
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
      return failure('Failed to update goal progress', 'GOAL_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to update goal progress', code || 'GOAL_UPDATE_FAILED')
  }
}

// 目標を削除
export async function deleteGoal(id: string): Promise<Result<void>> {
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
      return failure('Failed to delete goal', 'GOAL_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to delete goal', code || 'GOAL_DELETE_FAILED')
  }
}

// 目標を完了に設定
export async function completeGoal(id: string): Promise<Result<void>> {
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
      return failure('Failed to complete goal', 'GOAL_COMPLETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to complete goal', code || 'GOAL_COMPLETE_FAILED')
  }
}

// アクティブな目標を取得
export async function getActiveGoals(): Promise<Result<Goal[]>> {
  try {
    const result = await getGoals()
    if (!result.success) {
      return result
    }
    const activeGoals = result.data.filter(goal => goal.status === 'active')
    return success(activeGoals)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to fetch active goals', code || 'GOAL_FETCH_FAILED')
  }
}

// 目標に星座データを追加または更新
export async function updateGoalConstellation(
  goalId: string,
  constellation: ConstellationData,
  existingGoals?: Goal[]
): Promise<Result<void>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    // 既存の星座位置を取得
    let goals = existingGoals;
    if (!goals) {
      const goalsResult = await getActiveGoals();
      goals = goalsResult.success ? goalsResult.data : [];
    }

    // 既存の星座との重なりを避ける位置を計算
    const position = calculateConstellationPosition(goals);

    const { error } = await supabase
      .from('goals')
      .update({
        constellation_nodes: constellation.nodes as unknown as ConstellationNode[],
        constellation_edges: constellation.edges as unknown as ConstellationEdge[],
        constellation_symbol: constellation.symbolName,
        constellation_message: constellation.message,
        constellation_position_x: position.x,
        constellation_position_y: position.y,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      safeError('星座データ更新エラー', { error, goalId, userId: user.id })
      return failure('Failed to update constellation', 'CONSTELLATION_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    revalidatePath('/horizon')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to update constellation', code || 'CONSTELLATION_UPDATE_FAILED')
  }
}

// 星座の配置位置を計算（既存の星座と重ならないように）
function calculateConstellationPosition(existingGoals: Goal[]): { x: number; y: number } {
  // 既存の星座の位置を取得
  const existingPositions = existingGoals
    .filter(g => g.constellation_position_x !== null && g.constellation_position_y !== null)
    .map(g => ({ x: g.constellation_position_x!, y: g.constellation_position_y! }));

  // 配置可能なエリア（月の周りの空間）
  // 月は中心にあるので、その周りに星座を配置
  const minDistance = 1.5; // 星座間の最小距離

  // ランダムな位置を試行
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // ランダムな角度と距離で位置を決定
    const angle = Math.random() * Math.PI * 2;
    const distance = 4 + Math.random() * 3; // 月から4〜7の距離
    
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    // 既存の星座との距離をチェック
    const tooClose = existingPositions.some(pos => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist < minDistance;
    });

    if (!tooClose) {
      return { x, y };
    }

    attempts++;
  }

  // どうしても見つからない場合はランダムな位置を返す
  const angle = Math.random() * Math.PI * 2;
  const distance = 4 + Math.random() * 3;
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
}

// 目標から星座データを削除
export async function deleteGoalConstellation(goalId: string): Promise<Result<void>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('goals')
      .update({
        constellation_nodes: null,
        constellation_edges: null,
        constellation_symbol: null,
        constellation_message: null,
        constellation_position_x: null,
        constellation_position_y: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      safeError('星座データ削除エラー', { error, goalId, userId: user.id })
      return failure('Failed to delete constellation', 'CONSTELLATION_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    revalidatePath('/horizon')

    return success(undefined)
  } catch (error) {
    // エラーコードを取得して返す
    const code = getErrorCode(error)
    return failure('Failed to delete constellation', code || 'CONSTELLATION_DELETE_FAILED')
  }
} 