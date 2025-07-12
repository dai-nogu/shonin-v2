"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Activity = Database['public']['Tables']['activities']['Row']
type ActivityInsert = Database['public']['Tables']['activities']['Insert']
type ActivityUpdate = Database['public']['Tables']['activities']['Update']

// テスト用のダミーユーザーID
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000000'

export function useActivitiesDb() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // アクティビティを取得
  const fetchActivities = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', DUMMY_USER_ID)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Activities fetch error:', error)
        throw error
      }

      setActivities(data || [])
    } catch (err) {
      console.error('Error in fetchActivities:', err)
      setError(err instanceof Error ? err.message : 'アクティビティの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // アクティビティを追加
  const addActivity = async (activity: Omit<ActivityInsert, 'user_id'>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...activity,
          user_id: DUMMY_USER_ID,
        })
        .select('id')
        .single()

      if (error) {
        console.error('Activity insert error:', error)
        throw error
      }

      await fetchActivities() // リストを更新
      return data.id
    } catch (err) {
      console.error('Error in addActivity:', err)
      setError(err instanceof Error ? err.message : 'アクティビティの追加に失敗しました')
      return null
    }
  }

  // アクティビティを更新
  const updateActivity = async (id: string, updates: ActivityUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('activities')
        .update(updates)
        .eq('id', id)

      if (error) {
        console.error('Activity update error:', error)
        throw error
      }

      await fetchActivities() // リストを更新
      return true
    } catch (err) {
      console.error('Error in updateActivity:', err)
      setError(err instanceof Error ? err.message : 'アクティビティの更新に失敗しました')
      return false
    }
  }

  // アクティビティを削除
  const deleteActivity = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Activity delete error:', error)
        throw error
      }

      await fetchActivities() // リストを更新
      return true
    } catch (err) {
      console.error('Error in deleteActivity:', err)
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
    fetchActivities()
  }, [])

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