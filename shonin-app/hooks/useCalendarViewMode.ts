"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { getPlanLimits, type PlanType } from "@/types/subscription"

interface UseCalendarViewModeProps {
  initialDate?: Date
  userPlan?: PlanType
  viewMode?: "month" | "week"
}

export function useCalendarViewMode(props?: UseCalendarViewModeProps) {
  const { initialDate, userPlan = 'free', viewMode } = props || {}
  const searchParams = useSearchParams()
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">(viewMode || "month")
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentDate, setCurrentDate] = useState(initialDate || new Date())
  const [showPlanLimitModal, setShowPlanLimitModal] = useState(false)

  // URLパラメータからビューモードを設定
  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'week' || view === 'month') {
      setCalendarViewMode(view)
    }
  }, [searchParams])

  // 初期化時にローカルストレージから設定を復元（propsで指定されていない場合のみ）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // propsでviewModeが指定されている場合は、それを優先
      if (viewMode) {
        setCalendarViewMode(viewMode)
      } else {
        const savedViewMode = localStorage.getItem('app-calendar-view-mode')
        if (savedViewMode === 'month' || savedViewMode === 'week') {
          setCalendarViewMode(savedViewMode)
        }
      }
      setIsInitialized(true)
    }
  }, [viewMode])

  // カレンダー表示モードの保存
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      localStorage.setItem('app-calendar-view-mode', calendarViewMode)
    }
  }, [calendarViewMode, isInitialized])

  // ナビゲーション関数
  const onNavigate = useCallback((direction: "prev" | "next") => {
    const planLimits = getPlanLimits(userPlan)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 時刻をリセット
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // 今月の1日を取得
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate)
      
      if (calendarViewMode === "month") {
        if (direction === "prev") {
          newDate.setMonth(newDate.getMonth() - 1)
          
          // Freeプランの場合、当月より前に移動できない
          if (!planLimits.hasPastCalendar) {
            const newMonth = newDate.getMonth()
            const newYear = newDate.getFullYear()
            
            if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
              setShowPlanLimitModal(true)
              return prevDate // 移動しない
            }
          }
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
      } else {
        if (direction === "prev") {
          newDate.setDate(newDate.getDate() - 7)
          
          // Freeプランの場合、過去の制限をチェック
          if (planLimits.calendarDaysLimit) {
            // 週の開始日（日曜日）を計算
            const weekStart = new Date(newDate)
            const dayOfWeek = weekStart.getDay()
            weekStart.setDate(weekStart.getDate() - dayOfWeek)
            
            // 週の終了日（土曜日）を計算
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekStart.getDate() + 6)
            weekEnd.setHours(23, 59, 59, 999)
            
            // 週の終了日が今日より未来の場合は制限なし（未来から戻ってくる場合）
            if (weekEnd > today) {
              // 制限なし、移動可能
            } else {
              // 過去の週の場合のみ、制限をチェック
              // 今日から過去7日間の開始日を計算（今日を含む）
              const limitDate = new Date(today)
              limitDate.setDate(limitDate.getDate() - (planLimits.calendarDaysLimit - 1))
              limitDate.setHours(0, 0, 0, 0)
              
              // 週の終了日が制限日より前の場合はブロック
              if (weekEnd < limitDate) {
                setShowPlanLimitModal(true)
                return prevDate // 移動しない
              }
            }
          }
        } else {
          newDate.setDate(newDate.getDate() + 7)
        }
      }
      return newDate
    })
  }, [calendarViewMode, userPlan])

  const onTodayClick = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  return {
    calendarViewMode,
    setCalendarViewMode,
    currentDate,
    onNavigate,
    onTodayClick,
    showPlanLimitModal,
    setShowPlanLimitModal,
  }
} 