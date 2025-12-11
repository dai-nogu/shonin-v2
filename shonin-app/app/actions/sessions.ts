'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { AppError, handleServerError, requireAuth, getErrorCode } from '@/lib/server-error'
import { safeError } from '@/lib/safe-logger'
import { JA_INPUT_LIMITS, truncateForDb } from '@/lib/input-limits'

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
    safeError('認証エラー', error)
    // クライアントには安全なエラーコードのみ
    throw requireAuth()
  }
  
  return user
}

// セッションを取得（アクティビティ情報も含む）
export async function getSessions(): Promise<Result<SessionWithActivity[]>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('decrypted_session')
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
      safeError('セッション取得エラー', { error, userId: user.id })
      return failure('Failed to fetch sessions', 'SESSION_FETCH_FAILED')
    }

    return success(data || [])
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to fetch sessions', code || 'SESSION_FETCH_FAILED')
  }
}

// セッションを追加
export async function addSession(session: Omit<SessionInsert, 'user_id'>): Promise<Result<string>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    // サーバー側で文字数制限を適用（UIバイパス対策）
    const sanitizedSession = {
      ...session,
      location: truncateForDb(session.location, JA_INPUT_LIMITS.location),
      user_id: user.id,
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert(sanitizedSession)
      .select('id')
      .single()

    if (error) {
      safeError('セッション追加エラー', { error, userId: user.id })
      return failure('Failed to add session', 'SESSION_ADD_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return success(data.id)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to add session', code || 'SESSION_ADD_FAILED')
  }
}

// セッションを更新
export async function updateSession(id: string, updates: SessionUpdate): Promise<Result<boolean>> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    // サーバー側で文字数制限を適用（UIバイパス対策）
    const sanitizedUpdates = {
      ...updates,
      location: updates.location !== undefined 
        ? truncateForDb(updates.location, JA_INPUT_LIMITS.location) 
        : undefined,
    }

    const { error } = await supabase
      .from('sessions')
      .update(sanitizedUpdates)
      .eq('id', id)

    if (error) {
      safeError('セッション更新エラー', { error, sessionId: id, userId: user.id })
      return failure('Failed to update session', 'SESSION_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return success(true)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to update session', code || 'SESSION_UPDATE_FAILED')
  }
}

// セッションを削除
export async function deleteSession(id: string): Promise<Result<boolean>> {
  try {
    const user = await getCurrentUser() // 認証チェック
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)

    if (error) {
      safeError('セッション削除エラー', { error, sessionId: id, userId: user.id })
      return failure('Failed to delete session', 'SESSION_DELETE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/dashboard')
    revalidatePath('/calendar')
    revalidatePath('/session')

    return success(true)
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to delete session', code || 'SESSION_DELETE_FAILED')
  }
}

// 期間指定でセッションを取得
export async function getSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<Result<SessionWithActivity[]>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('decrypted_session')
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
      safeError('期間指定セッション取得エラー', { error, userId: user.id, startDate, endDate })
      return failure('Failed to fetch sessions by date range', 'SESSION_FETCH_FAILED')
    }

    return success(data || [])
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to fetch sessions by date range', code || 'SESSION_FETCH_FAILED')
  }
}

// アクティビティ別の統計を取得
export async function getActivityStats(): Promise<Result<ActivityStat[]>> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('decrypted_session')
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
      safeError('統計取得エラー', { error, userId: user.id })
      return failure('Failed to fetch activity stats', 'SESSION_FETCH_FAILED')
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

    return success(Object.values(stats || {}))
  } catch (error) {
    const code = getErrorCode(error)
    return failure('Failed to fetch activity stats', code || 'SESSION_FETCH_FAILED')
  }
} 