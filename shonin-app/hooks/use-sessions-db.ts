"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
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

// テスト用のダミーユーザーID
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

export function useSessionsDb() {
  const [sessions, setSessions] = useState<SessionWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // セッションを取得（アクティビティ情報とタグも含む）
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)

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
        .eq('user_id', DUMMY_USER_ID)
        .order('start_time', { ascending: false })

      if (error) {
        console.error('Sessions fetch error:', error)
        throw error
      }

      setSessions(data || [])
    } catch (err) {
      console.error('Error in fetchSessions:', err)
      setError(err instanceof Error ? err.message : 'セッションの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, []) // 依存配列を空にしてメモ化

  // セッションを追加
  const addSession = useCallback(async (session: Omit<SessionInsert, 'user_id'>, skipRefetch: boolean = false): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...session,
          user_id: DUMMY_USER_ID,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Session insert error:', error)
        throw error
      }

      // skipRefetchがfalseの場合のみリストを更新
      if (!skipRefetch) {
        fetchSessions().catch(console.error)
      }
      return data.id
    } catch (err) {
      console.error('Error in addSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの追加に失敗しました')
      return null
    }
  }, [fetchSessions])

  // セッションを更新
  const updateSession = useCallback(async (id: string, updates: SessionUpdate, skipRefetch: boolean = false): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Session update error:', error)
        throw error
      }

      // skipRefetchがfalseの場合のみリストを更新
      if (!skipRefetch) {
        fetchSessions().catch(console.error)
      }
      return true
    } catch (err) {
      console.error('Error in updateSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')
      return false
    }
  }, [fetchSessions])

  // セッションを削除
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Session delete error:', error)
        throw error
      }

      // リストを更新（非同期で実行、エラーは無視）
      fetchSessions().catch(console.error)
      return true
    } catch (err) {
      console.error('Error in deleteSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの削除に失敗しました')
      return false
    }
  }, [fetchSessions])

  // 期間指定でセッションを取得
  const getSessionsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<SessionWithActivity[]> => {
    try {
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
        .eq('user_id', DUMMY_USER_ID)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: false })

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Error in getSessionsByDateRange:', err)
      setError(err instanceof Error ? err.message : '期間指定セッションの取得に失敗しました')
      return []
    }
  }, [])

  // アクティビティ別の統計を取得
  const getActivityStats = useCallback(async () => {
    try {
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
        .eq('user_id', DUMMY_USER_ID)
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
    } catch (err) {
      console.error('Error in getActivityStats:', err)
      setError(err instanceof Error ? err.message : '統計の取得に失敗しました')
      return []
    }
  }, [])

  // 初回読み込み
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    getSessionsByDateRange,
    getActivityStats,
    refetch: fetchSessions,
  }
} 