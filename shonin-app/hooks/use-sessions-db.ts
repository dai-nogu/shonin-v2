"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import * as sessionsActions from '@/app/actions/sessions'

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

export function useSessionsDb() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionWithActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // セッションを取得（アクティビティ情報とタグも含む）- 復号化ビューを使用
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        setSessions([])
        setLoading(false)
        return
      }

      const data = await sessionsActions.getSessions()
      setSessions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セッションの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [user?.id]) // ユーザーIDに依存

  // セッションを追加
  const addSession = useCallback(async (session: Omit<SessionInsert, 'user_id'>, skipRefetch: boolean = false): Promise<string | null> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return null
      }

      const sessionId = await sessionsActions.addSession(session)

      // skipRefetchがfalseの場合のみリストを更新
      if (!skipRefetch) {
        fetchSessions()
      }
      return sessionId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セッションの追加に失敗しました')
      return null
    }
  }, [fetchSessions, user?.id])

  // セッションを更新
  const updateSession = useCallback(async (id: string, updates: SessionUpdate, skipRefetch: boolean = false): Promise<boolean> => {
    try {
      const success = await sessionsActions.updateSession(id, updates)

      // skipRefetchがfalseの場合のみリストを更新
      if (!skipRefetch && success) {
        fetchSessions()
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セッションの更新に失敗しました')
      return false
    }
  }, [fetchSessions])

  // セッションを削除
  const deleteSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await sessionsActions.deleteSession(id)

      // リストを更新（非同期で実行、エラーは無視）
      if (success) {
        fetchSessions()
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'セッションの削除に失敗しました')
      return false
    }
  }, [fetchSessions])

  // 期間指定でセッションを取得
  const getSessionsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<SessionWithActivity[]> => {
    try {
      if (!user?.id) {
        return []
      }

      return await sessionsActions.getSessionsByDateRange(startDate, endDate)
    } catch (err) {
      setError(err instanceof Error ? err.message : '期間指定セッションの取得に失敗しました')
      return []
    }
  }, [user?.id])

  // アクティビティ別の統計を取得
  const getActivityStats = useCallback(async () => {
    try {
      if (!user?.id) {
        return []
      }

      return await sessionsActions.getActivityStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : '統計の取得に失敗しました')
      return []
    }
  }, [user?.id])

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