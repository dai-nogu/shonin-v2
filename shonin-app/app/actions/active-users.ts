'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import type { Result } from '@/types/result'
import { success, failure } from '@/types/result'
import { safeError } from '@/lib/safe-logger'

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

// アクティブユーザー数を取得（end_timeがnullのセッションを持つユーザー数）
export async function getActiveUsersCount(): Promise<Result<number>> {
  try {
    const supabase = await getSupabaseClient()

    // end_timeがnullのセッションを持つユーザーIDを取得
    const { data, error } = await supabase
      .from('sessions')
      .select('user_id')
      .is('end_time', null)

    if (error) {
      safeError('アクティブユーザー数取得エラー', { error })
      return failure('Failed to fetch active users count', 'ACTIVE_USERS_FETCH_FAILED')
    }

    if (!data || data.length === 0) {
      return success(0)
    }

    // ユニークなユーザーIDの数を計算
    const uniqueUserIds = new Set(
      data.map((session: { user_id: string }) => session.user_id)
    )
    const activeUsersCount = uniqueUserIds.size

    return success(activeUsersCount)
  } catch (error) {
    safeError('アクティブユーザー数取得エラー（例外）', { error })
    return failure('Failed to fetch active users count', 'ACTIVE_USERS_FETCH_FAILED')
  }
}
