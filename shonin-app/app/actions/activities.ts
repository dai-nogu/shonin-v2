'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { AppError, handleServerError, requireAuth, getErrorCode } from '@/lib/server-error'
import { safeError } from '@/lib/safe-logger'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

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

// アクティビティを取得
export async function getActivities(): Promise<Result<Activity[]>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      safeError('アクティビティ取得エラー', { error, userId: user.id })
      return failure('Failed to fetch activities', 'ACTIVITY_FETCH_FAILED')
    }

    return success(data || [])
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to fetch activities', code || 'ACTIVITY_FETCH_FAILED')
  }
}

// アクティビティを追加
export async function addActivity(activity: Omit<ActivityInsert, 'user_id'>): Promise<Result<string>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('activities')
      .insert({
        ...activity,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      safeError('アクティビティ追加エラー', { error, userId: user.id })
      return failure('Failed to add activity', 'ACTIVITY_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return success(data.id)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to add activity', code || 'ACTIVITY_ADD_FAILED')
  }
}

// アクティビティを更新
export async function updateActivity(id: string, updates: ActivityUpdate): Promise<Result<boolean>> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)

    if (error) {
      safeError('アクティビティ更新エラー', { error, activityId: id, userId: user.id })
      return failure('Failed to update activity', 'ACTIVITY_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return success(true)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to update activity', code || 'ACTIVITY_UPDATE_FAILED')
  }
}

// アクティビティを削除
export async function deleteActivity(id: string): Promise<Result<boolean>> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      safeError('アクティビティ削除エラー', { error, activityId: id, userId: user.id })
      return failure('Failed to delete activity', 'ACTIVITY_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return success(true)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to delete activity', code || 'ACTIVITY_DELETE_FAILED')
  }
} 