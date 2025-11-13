'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { AppError, handleServerError, requireAuth } from '@/lib/server-error'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

export interface ActivityStat {
  totalDuration: number
  sessionCount: number
  activityName: string
  activityIcon: string | null
  activityColor: string
}

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
    // サーバーログに詳細を記録
    console.error('認証エラー:', error)
    // クライアントには安全なエラーコードのみ
    throw requireAuth()
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

    if (error) {
      console.error('セッション取得エラー:', { error, userId: user.id })
      throw new AppError('SESSION_FETCH_FAILED')
    }

    return data || []
  } catch (error) {
    handleServerError(error, 'getSessions', 'SESSION_FETCH_FAILED')
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
      console.error('セッション追加エラー:', { error, userId: user.id })
      throw new AppError('SESSION_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return data.id
  } catch (error) {
    handleServerError(error, 'addSession', 'SESSION_ADD_FAILED')
  }
}

// セッションを更新
export async function updateSession(id: string, updates: SessionUpdate): Promise<boolean> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('セッション更新エラー:', { error, sessionId: id, userId: user.id })
      throw new AppError('SESSION_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return true
  } catch (error) {
    handleServerError(error, 'updateSession', 'SESSION_UPDATE_FAILED')
  }
}

// セッションを削除
export async function deleteSession(id: string): Promise<boolean> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('セッション削除エラー:', { error, sessionId: id, userId: user.id })
      throw new AppError('SESSION_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return true
  } catch (error) {
    handleServerError(error, 'deleteSession', 'SESSION_DELETE_FAILED')
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

    if (error) {
      console.error('期間指定セッション取得エラー:', { error, userId: user.id, startDate, endDate })
      throw new AppError('SESSION_FETCH_FAILED')
    }

    return data || []
  } catch (error) {
    handleServerError(error, 'getSessionsByDateRange', 'SESSION_FETCH_FAILED')
  }
}

// アクティビティ別の統計を取得
export async function getActivityStats(): Promise<ActivityStat[]> {
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

    if (error) {
      console.error('統計取得エラー:', { error, userId: user.id })
      throw new AppError('SESSION_FETCH_FAILED')
    }

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
    }, {} as Record<string, ActivityStat>)

    return Object.values(stats || {})
  } catch (error) {
    handleServerError(error, 'getActivityStats', 'SESSION_FETCH_FAILED')
  }
} 