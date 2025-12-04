"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { getUnreadFeedbackCount } from "@/app/actions/feedback"
import { useAuth } from "./auth-context"

interface FeedbackContextType {
  unreadCount: number
  loading: boolean
  error: string | null
  refreshUnreadCount: () => Promise<void>
  decrementUnreadCount: (amount?: number) => void
  clearUnreadCount: () => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 未読数を取得する関数
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await getUnreadFeedbackCount()
      
      if (result.success && result.count !== undefined) {
        setUnreadCount(result.count)
      } else {
        setError(result.error || "未読数の取得に失敗しました")
        setUnreadCount(0)
      }
    } catch (err) {
      setError("未読数の取得中にエラーが発生しました")
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  // 初回ロード時とユーザー変更時に未読数を取得
  useEffect(() => {
    fetchUnreadCount()
  }, [user?.id])

  // 未読数を手動でリフレッシュする関数
  const refreshUnreadCount = async () => {
    await fetchUnreadCount()
  }

  // 未読数を減らす（楽観的UI更新用）
  const decrementUnreadCount = (amount: number = 1) => {
    setUnreadCount(prev => Math.max(0, prev - amount))
  }

  // 未読数をゼロにする（すべて既読時）
  const clearUnreadCount = () => {
    setUnreadCount(0)
  }

  return (
    <FeedbackContext.Provider
      value={{
        unreadCount,
        loading,
        error,
        refreshUnreadCount,
        decrementUnreadCount,
        clearUnreadCount
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export function useFeedback() {
  const context = useContext(FeedbackContext)
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return context
}

