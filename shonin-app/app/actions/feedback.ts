"use server"

import { createClient } from "@/lib/supabase"
import { handleServerError } from "@/lib/server-error"
import type { AiFeedbackDecrypted } from "@/types/database"

/**
 * 未読フィードバック数を取得
 */
export async function getUnreadFeedbackCount(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    // 関数を呼び出して未読数を取得
    const { data, error } = await supabase.rpc('get_unread_feedback_count')

    if (error) {
      return handleServerError(error, "未読フィードバック数の取得に失敗しました")
    }

    return {
      success: true,
      count: data || 0
    }
  } catch (error) {
    return handleServerError(error, "未読フィードバック数の取得に失敗しました")
  }
}

/**
 * すべてのフィードバックを取得（既読/未読含む）
 */
export async function getAllFeedbacks(): Promise<{
  success: boolean
  feedbacks?: AiFeedbackDecrypted[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    // 復号化ビューからフィードバックを取得
    const { data, error } = await supabase
      .from('ai_feedback_decrypted')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return handleServerError(error, "フィードバックの取得に失敗しました")
    }

    return {
      success: true,
      feedbacks: data as AiFeedbackDecrypted[]
    }
  } catch (error) {
    return handleServerError(error, "フィードバックの取得に失敗しました")
  }
}

/**
 * 特定のフィードバックを既読にする
 */
export async function markFeedbackAsRead(feedbackId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    // 関数を呼び出してフィードバックを既読にする
    const { data, error } = await supabase.rpc('mark_feedback_as_read', {
      p_feedback_id: feedbackId
    })

    if (error) {
      return handleServerError(error, "フィードバックの既読化に失敗しました")
    }

    return { success: true }
  } catch (error) {
    return handleServerError(error, "フィードバックの既読化に失敗しました")
  }
}

/**
 * すべてのフィードバックを既読にする
 */
export async function markAllFeedbacksAsRead(): Promise<{
  success: boolean
  count?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // 認証確認
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "認証が必要です" }
    }

    // 関数を呼び出してすべてのフィードバックを既読にする
    const { data, error } = await supabase.rpc('mark_all_feedback_as_read')

    if (error) {
      return handleServerError(error, "フィードバックの一括既読化に失敗しました")
    }

    return {
      success: true,
      count: data || 0
    }
  } catch (error) {
    return handleServerError(error, "フィードバックの一括既読化に失敗しました")
  }
}

