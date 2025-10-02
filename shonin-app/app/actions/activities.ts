'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

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
    throw new Error('ログインが必要です')
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

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('アクティビティの取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'アクティビティの取得に失敗しました')
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

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return data.id
  } catch (error) {
    console.error('アクティビティの追加に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'アクティビティの追加に失敗しました')
  }
}

// アクティビティを更新
export async function updateActivity(id: string, updates: ActivityUpdate): Promise<boolean> {
  try {
    await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return true
  } catch (error) {
    console.error('アクティビティの更新に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'アクティビティの更新に失敗しました')
  }
}

// アクティビティを削除
export async function deleteActivity(id: string): Promise<boolean> {
  try {
    await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return true
  } catch (error) {
    console.error('アクティビティの削除に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'アクティビティの削除に失敗しました')
  }
} 