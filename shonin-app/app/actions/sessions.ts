'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export interface SessionWithActivity extends Session {
  activities?: {
    name: string
    icon: string | null
    color: string
  }
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

// セッションを取得（アクティビティ情報も含む）- 復号化ビューを使用
export async function getSessions(): Promise<SessionWithActivity[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('sessions_reflections_decrypted')
      .select(`
        *,
        activities (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('セッションの取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'セッションの取得に失敗しました')
  }
}

// セッションを追加
export async function addSession(session: Omit<SessionInsert, 'user_id'>): Promise<string> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        ...session,
        user_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Session insert failed: ${error.message || 'Unknown error'}`)
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return data.id
  } catch (error) {
    console.error('セッションの追加に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'セッションの追加に失敗しました')
  }
}

// セッションを更新
export async function updateSession(id: string, updates: SessionUpdate): Promise<boolean> {
  try {
    await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return true
  } catch (error) {
    console.error('セッションの更新に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'セッションの更新に失敗しました')
  }
}

// セッションを削除
export async function deleteSession(id: string): Promise<boolean> {
  try {
    await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) throw error

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return true
  } catch (error) {
    console.error('セッションの削除に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'セッションの削除に失敗しました')
  }
}

// 期間指定でセッションを取得
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<SessionWithActivity[]> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        activities (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .order('start_time', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('期間指定セッションの取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '期間指定セッションの取得に失敗しました')
  }
}

// アクティビティ別の統計を取得
export async function getActivityStats() {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        activity_id,
        duration,
        activities (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .not('end_time', 'is', null) // 終了済みのセッションのみ

    if (error) throw error

    // アクティビティ別に集計
    const stats = data?.reduce((acc, session) => {
      const activityId = session.activity_id
      // activitiesは単一のオブジェクトとしてアクセス
      const activity = session.activities as unknown as { name: string; icon: string | null; color: string } | null
      
      if (!acc[activityId]) {
        acc[activityId] = {
          totalDuration: 0,
          sessionCount: 0,
          activityName: activity?.name || '不明',
          activityIcon: activity?.icon,
          activityColor: activity?.color || '#6366f1',
        }
      }
      acc[activityId].totalDuration += session.duration
      acc[activityId].sessionCount += 1
      return acc
    }, {} as Record<string, any>)

    return Object.values(stats || {})
  } catch (error) {
    console.error('統計の取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : '統計の取得に失敗しました')
  }
} 