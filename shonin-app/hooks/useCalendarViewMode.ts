"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function useCalendarViewMode() {
  const searchParams = useSearchParams()
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  const [isInitialized, setIsInitialized] = useState(false)

  // URLパラメータからビューモードを設定
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'week' || view === 'month') {
      setCalendarViewMode(view)
    }
  }, [searchParams])

  // 初期化時にローカルストレージから設定を復元
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('shonin-calendar-view-mode')
      if (savedViewMode === 'month' || savedViewMode === 'week') {
        setCalendarViewMode(savedViewMode)
      }
      setIsInitialized(true)
    }
  }, [])

  // カレンダー表示モードの保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('shonin-calendar-view-mode', calendarViewMode)
    }
  }, [calendarViewMode, isInitialized])

  return {
    calendarViewMode,
    setCalendarViewMode
  }
} 