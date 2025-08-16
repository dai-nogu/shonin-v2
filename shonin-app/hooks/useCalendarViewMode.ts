"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function useCalendarViewMode(initialDate?: Date) {
  const searchParams = useSearchParams()
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())

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

  // ナビゲーション関数
  const onNavigate = (direction: "prev" | "next") => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      if (calendarViewMode === "month") {
        if (direction === "prev") {
          newDate.setMonth(newDate.getMonth() - 1)
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
      } else {
        if (direction === "prev") {
          newDate.setDate(newDate.getDate() - 7)
        } else {
          newDate.setDate(newDate.getDate() + 7)
        }
      }
      return newDate
    })
  }

  const onTodayClick = () => {
    setCurrentDate(new Date())
  }

  return {
    calendarViewMode,
    setCalendarViewMode,
    currentDate,
    onNavigate,
    onTodayClick
  }
} 