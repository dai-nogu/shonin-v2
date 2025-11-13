'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { AppError, handleServerError, requireAuth } from '@/lib/server-error'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

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

// プロフィールを取得
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      // プロフィールが存在しない場合は新規作成
      if (error.code === 'PGRST116') {
        const newProfile: Database['public']['Tables']['users']['Insert'] = {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          timezone: 'Asia/Tokyo'
        }

        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single()

        if (insertError) {
          console.error('プロフィール作成エラー:', { error: insertError, userId: user.id })
          throw new AppError('PROFILE_UPDATE_FAILED')
        }

        return insertData
      } else {
        console.error('プロフィール取得エラー:', { error, userId: user.id })
        throw new AppError('PROFILE_FETCH_FAILED')
      }
    }

    return data
  } catch (error) {
    handleServerError(error, 'getProfile', 'PROFILE_FETCH_FAILED')
  }
}

// プロフィールを更新
export async function updateProfile(updates: Partial<UserProfileUpdate>): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    const supabase = await getSupabaseClient()

    // 更新日時を追加
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('プロフィール更新エラー:', { error, userId: user.id })
      throw new AppError('PROFILE_UPDATE_FAILED')
    }

    // キャッシュを再検証
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    handleServerError(error, 'updateProfile', 'PROFILE_UPDATE_FAILED')
  }
}

// ユーザー名を更新
export async function updateUserName(name: string): Promise<boolean> {
  return await updateProfile({ name })
}

// タイムゾーンを更新
export async function updateTimezone(timezone: string): Promise<boolean> {
  return await updateProfile({ timezone })
} 