"use client"

import { useState, useEffect } from 'react'
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
  session_tags?: Array<{
    tag_name: string
  }>
}

// テスト用のダミーユーザーID
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

export function useSessionsDb() {
  const [sessions, setSessions] = useState<SessionWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // セッションを取得（アクティビティ情報とタグも含む）
  const fetchSessions = async () => {
    try {
      setLoading(true)
      console.log('Fetching sessions...')

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          activities (
            name,
            icon,
            color
          ),
          session_tags (
            tag_name
          )
        `)
        .eq('user_id', DUMMY_USER_ID)
        .order('start_time', { ascending: false })

      console.log('Sessions response:', { data, error })

      if (error) {
        console.error('Sessions fetch error:', error)
        throw error
      }

      setSessions(data || [])
      console.log('Sessions loaded:', data?.length || 0)
    } catch (err) {
      console.error('Error in fetchSessions:', err)
      setError(err instanceof Error ? err.message : 'セッションの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // セッションを追加
  const addSession = async (session: Omit<SessionInsert, 'user_id'>): Promise<string | null> => {
    try {
      console.log('Adding session:', session)

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          ...session,
          user_id: DUMMY_USER_ID,
        })
        .select('id')
        .single()

      console.log('Session insert response:', { data, error })

      if (error) {
        console.error('Session insert error:', error)
        throw error
      }

      await fetchSessions() // リストを更新
      console.log('Session added successfully:', data.id)
      return data.id
    } catch (err) {
      console.error('Error in addSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの追加に失敗しました')
      return null
    }
  }

  // セッションを更新
  const updateSession = async (id: string, updates: SessionUpdate): Promise<boolean> => {
    try {
      console.log('Updating session:', id, updates)

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Session update error:', error)
        throw error
      }

      await fetchSessions() // リストを更新
      return true
    } catch (err) {
      console.error('Error in updateSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')
      return false
    }
  }

  // セッションを削除
  const deleteSession = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting session:', id)

      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Session delete error:', error)
        throw error
      }

      await fetchSessions() // リストを更新
      return true
    } catch (err) {
      console.error('Error in deleteSession:', err)
      setError(err instanceof Error ? err.message : 'セッションの削除に失敗しました')
      return false
    }
  }

  // セッションタグを追加
  const addSessionTags = async (sessionId: string, tags: string[]): Promise<boolean> => {
    try {
      console.log('Adding session tags:', sessionId, tags)

      const tagInserts = tags.map(tag => ({
        session_id: sessionId,
        tag_name: tag,
      }))

      const { error } = await supabase
        .from('session_tags')
        .insert(tagInserts)

      if (error) {
        console.error('Tags insert error:', error)
        throw error
      }

      return true
    } catch (err) {
      console.error('Error in addSessionTags:', err)
      setError(err instanceof Error ? err.message : 'タグの追加に失敗しました')
      return false
    }
  }

  // 期間指定でセッションを取得
  const getSessionsByDateRange = async (startDate: string, endDate: string): Promise<SessionWithActivity[]> => {
    try {
      console.log('Getting sessions by date range:', startDate, endDate)

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          activities (
            name,
            icon,
            color
          ),
          session_tags (
            tag_name
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
  }

  // アクティビティ別の統計を取得
  const getActivityStats = async () => {
    try {
      console.log('Getting activity stats...')

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
        if (!acc[activityId]) {
          acc[activityId] = {
            totalDuration: 0,
            sessionCount: 0,
            activityName: session.activities?.name || '不明',
            activityIcon: session.activities?.icon,
            activityColor: session.activities?.color || '#6366f1',
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
  }

  // 初回読み込み
  useEffect(() => {
    fetchSessions()
  }, [])

  return {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    addSessionTags,
    getSessionsByDateRange,
    getActivityStats,
    refetch: fetchSessions,
  }
} 