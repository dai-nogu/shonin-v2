"use client"

import { useEffect, useRef, useCallback } from "react"
import { hasSessionPhotosMultiple, preloadImages, getSessionPhotos } from "@/lib/upload-photo"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface UseSessionPhotosProps {
  completedSessions: CompletedSession[]
  setCompletedSessions: (sessions: CompletedSession[]) => void
}

export function useSessionPhotos({ completedSessions, setCompletedSessions }: UseSessionPhotosProps) {
  // 処理済みのセッションIDを追跡（無限ループ防止）
  const processedSessionIdsRef = useRef<Set<string>>(new Set())
  
  // setCompletedSessionsを安定した参照で保持
  const setCompletedSessionsRef = useRef(setCompletedSessions)
  setCompletedSessionsRef.current = setCompletedSessions
  
  // セッションの写真有無を確認してcompletedSessionsを更新
  useEffect(() => {
    // アンマウント後のsetState防止フラグ
    let isMounted = true
    
    const updateSessionsWithPhotos = async () => {
      if (!completedSessions || completedSessions.length === 0) {
        return
      }

      // まだ処理していないセッションのみ抽出
      const unprocessedSessions = completedSessions.filter(
        session => !processedSessionIdsRef.current.has(session.id)
      )
      
      // 全て処理済みなら何もしない（無限ループ防止）
      if (unprocessedSessions.length === 0) {
        return
      }

      const sessionIds = unprocessedSessions.map(session => session.id)
      const photoStatusMap = await hasSessionPhotosMultiple(sessionIds)

      // アンマウント済みの場合はsetStateしない
      if (!isMounted) return

      // 処理済みとしてマーク
      sessionIds.forEach(id => processedSessionIdsRef.current.add(id))

      // 写真情報を更新（新しいセッションのみ更新）
      const sessionsWithPhotos: CompletedSession[] = completedSessions.map(session => {
        // 今回処理したセッションのみ写真情報を更新
        if (photoStatusMap[session.id] !== undefined) {
          return {
            ...session,
            hasPhotos: photoStatusMap[session.id] || false
          }
        }
        return session
      })

      setCompletedSessionsRef.current(sessionsWithPhotos)

      // 写真付きセッションの画像を事前にプリロード
      const sessionsWithPhotosIds = sessionsWithPhotos
        .filter(session => session.hasPhotos)
        .slice(0, 5) // 最新5件の写真付きセッションのみプリロード
        .map(session => session.id)

      if (sessionsWithPhotosIds.length > 0 && isMounted) {
        preloadSessionPhotos(sessionsWithPhotosIds)
      }
    }

    updateSessionsWithPhotos()
    
    // クリーンアップ：アンマウント時にフラグを更新
    return () => {
      isMounted = false
    }
  // NOTE: setCompletedSessionsはrefで管理しているため、依存配列から除外
  // completedSessionsのIDリストの変化のみを監視
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSessions.map(s => s.id).join(',')])

  // 写真付きセッションの画像を事前にプリロードする関数
  const preloadSessionPhotos = async (sessionIds: string[]) => {
    try {
      const preloadPromises = sessionIds.map(async (sessionId) => {
        try {
          const photos = await getSessionPhotos(sessionId)
          const imageUrls = photos.map(photo => photo.url)
          
          if (imageUrls.length > 0) {
            return preloadImages(imageUrls)
          }
        } catch (error) {
          // エラーは無視してバックグラウンドプリロードを継続
        }
      })

      await Promise.allSettled(preloadPromises)
    } catch (error) {
      // バックグラウンドプリロードのエラーは無視
    }
  }

  return {
    // 必要に応じて写真関連のユーティリティ関数を追加
  }
} 