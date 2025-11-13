'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { AppError, handleServerError, requireAuth } from '@/lib/server-error'

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
    console.error('認証エラー:', error)
    // クライアントには安全なエラーコードのみ
    throw requireAuth()
  }
  
  return user
}

// アクティビティを取得
export async function getActivities(): Promise<Activity[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('アクティビティ取得エラー:', { error, userId: user.id })
      throw new AppError('ACTIVITY_FETCH_FAILED')
    }

    return data || []
  } catch (error) {
    handleServerError(error, 'getActivities', 'ACTIVITY_FETCH_FAILED')
  }
}

// アクティビティを追加
export async function addActivity(activity: Omit<ActivityInsert, 'user_id'>): Promise<string> {
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
      console.error('アクティビティ追加エラー:', { error, userId: user.id })
      throw new AppError('ACTIVITY_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return data.id
  } catch (error) {
    handleServerError(error, 'addActivity', 'ACTIVITY_ADD_FAILED')
  }
}

// アクティビティを更新
export async function updateActivity(id: string, updates: ActivityUpdate): Promise<boolean> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('アクティビティ更新エラー:', { error, activityId: id, userId: user.id })
      throw new AppError('ACTIVITY_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return true
  } catch (error) {
    handleServerError(error, 'updateActivity', 'ACTIVITY_UPDATE_FAILED')
  }
}

// アクティビティを削除
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('アクティビティ削除エラー:', { error, activityId: id, userId: user.id })
      throw new AppError('ACTIVITY_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return true
  } catch (error) {
    handleServerError(error, 'deleteActivity', 'ACTIVITY_DELETE_FAILED')
  }
} 