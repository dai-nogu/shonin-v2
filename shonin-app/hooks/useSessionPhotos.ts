"use client"

import { useEffect } from "react"
import { hasSessionPhotosMultiple, preloadImages, getSessionPhotos } from "@/lib/upload-photo"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

interface UseSessionPhotosProps {
  completedSessions: CompletedSession[]
  setCompletedSessions: (sessions: CompletedSession[]) => void
}

export function useSessionPhotos({ completedSessions, setCompletedSessions }: UseSessionPhotosProps) {
  
  // セッションの写真有無を確認してcompletedSessionsを更新
  useEffect(() => {
    const updateSessionsWithPhotos = async () => {
      if (!completedSessions || completedSessions.length === 0) {
        return
      }

      const sessionIds = completedSessions.map(session => session.id)
      const photoStatusMap = await hasSessionPhotosMultiple(sessionIds)

      // 写真情報を更新
      const sessionsWithPhotos: CompletedSession[] = completedSessions.map(session => ({
        ...session,
        hasPhotos: photoStatusMap[session.id] || false
      }))

      setCompletedSessions(sessionsWithPhotos)

      // 写真付きセッションの画像を事前にプリロード
      const sessionsWithPhotosIds = sessionsWithPhotos
        .filter(session => session.hasPhotos)
        .slice(0, 5) // 最新5件の写真付きセッションのみプリロード
        .map(session => session.id)

      if (sessionsWithPhotosIds.length > 0) {
        preloadSessionPhotos(sessionsWithPhotosIds)
      }
    }

    updateSessionsWithPhotos()
  }, [completedSessions, setCompletedSessions])

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