"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useSessions } from "@/contexts/sessions-context"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

export function useSessionList() {
  const { user } = useAuth()
  const [isInitialized, setIsInitialized] = useState(false)
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])

  // セッションコンテキストから状態を取得
  // NOTE: use-sessions-db.ts の初回読み込みuseEffectがデータを取得するため、
  // ここでrefetch()を呼ぶ必要はない
  const { sessions } = useSessions()

  // 初期化処理
  // NOTE: sessionsはContextで管理されており、use-sessions-dbが初回読み込みを行うため、
  // ここでは単にuserの存在を確認して初期化完了とする
  useEffect(() => {
    if (!user) return
    setIsInitialized(true)
  }, [user])

  // セッションデータが更新されたときに基本的な変換処理
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const updateCompletedSessions = () => {
      // アンマウント済みの場合は何もしない
      if (!isMounted) return
      
      if (!sessions || sessions.length === 0) {
        setCompletedSessions([])
        return
      }

      const completedSessionsData = sessions.filter(session => session.end_time)
      
      if (completedSessionsData.length === 0) {
        setCompletedSessions([])
        return
      }

      // 基本的なCompletedSessionの型に変換（写真情報は含まない）
      const convertedSessions: CompletedSession[] = completedSessionsData.map(session => {
        // notesがJSON形式の場合はパースして振り返りデータを取り出す
        let parsedNotes = session.notes || ''
        let achievements = session.achievements || undefined
        let challenges = session.challenges || undefined
        
        if (session.notes && session.notes.startsWith('{')) {
          try {
            const parsed = JSON.parse(session.notes)
            achievements = parsed.achievements || achievements
            challenges = parsed.challenges || challenges
            parsedNotes = parsed.additionalNotes || ''
          } catch {
            // JSONパースに失敗した場合はそのまま使用
          }
        }
        
        return {
          id: session.id,
          activityId: session.activity_id,
          activityName: session.activities?.name || '不明',
          startTime: new Date(session.start_time),
          endTime: new Date(session.end_time!),
          duration: session.duration,
          sessionDate: session.session_date || undefined,
          location: session.location || '',
          notes: parsedNotes,
          mood: session.mood || session.mood_score || undefined,
          achievements,
          challenges,
          activityColor: session.activities?.color,
          activityIcon: session.activities?.icon || undefined,
          goalId: session.goal_id || undefined,
          hasPhotos: false // デフォルト値
        }
      })

      setCompletedSessions(convertedSessions)
    }

    updateCompletedSessions()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  }, [sessions])

  return {
    user,
    isInitialized,
    completedSessions,
    setCompletedSessions, // 写真フックで更新するために公開
    sessions
  }
} 