"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/types/database'
import * as activitiesActions from '@/app/actions/activities'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

export function useActivitiesDb() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // アクティビティを取得
  const fetchActivities = async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        setActivities([])
        setLoading(false)
        return
      }

      const data = await activitiesActions.getActivities()
      setActivities(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // アクティビティを追加
  const addActivity = async (activity: Omit<ActivityInsert, 'user_id'>): Promise<string | null> => {
    try {
      if (!user?.id) {
        setError('ログインが必要です')
        return null
      }

      const activityId = await activitiesActions.addActivity(activity)
      await fetchActivities() // リストを更新
      return activityId
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの追加に失敗しました')
      return null
    }
  }

  // アクティビティを更新
  const updateActivity = async (id: string, updates: ActivityUpdate): Promise<boolean> => {
    try {
      const success = await activitiesActions.updateActivity(id, updates)
      if (success) {
        await fetchActivities() // リストを更新
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの更新に失敗しました')
      return false
    }
  }

  // アクティビティを削除
  const deleteActivity = async (id: string): Promise<boolean> => {
    try {
      const success = await activitiesActions.deleteActivity(id)
      if (success) {
        await fetchActivities() // リストを更新
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アクティビティの削除に失敗しました')
      return false
    }
  }

  // アクティビティを取得（ID指定）
  const getActivity = (id: string): Activity | undefined => {
    return activities.find(activity => activity.id === id)
  }

  // 初回読み込み
  useEffect(() => {
    if (user?.id) {
      fetchActivities()
    }
  }, [user?.id])

  return {
    activities,
    loading,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivity,
    refetch: fetchActivities,
  }
} 