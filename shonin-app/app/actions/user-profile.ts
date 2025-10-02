'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

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
    throw new Error('ログインが必要です')
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
          throw insertError
        }

        return insertData
      } else {
        throw error
      }
    }

    return data
  } catch (error) {
    console.error('プロフィールの取得に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'プロフィールの取得に失敗しました')
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
      throw error
    }

    // キャッシュを再検証
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return true
  } catch (error) {
    console.error('プロフィールの更新に失敗:', error)
    throw new Error(error instanceof Error ? error.message : 'プロフィールの更新に失敗しました')
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