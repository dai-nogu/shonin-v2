"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { getPlanLimits, type PlanType } from "@/types/subscription"

interface UseCalendarViewModeProps {
  initialDate?: Date
  userPlan?: PlanType
}

export function useCalendarViewMode(props?: UseCalendarViewModeProps) {
  const { initialDate, userPlan = 'free' } = props || {}
  const searchParams = useSearchParams()
  const [calendarViewMode, setCalendarViewMode] = useState<"month" | "week">("month")
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
  const onNavigate = useCallback((direction: "prev" | "next") => {
    const planLimits = getPlanLimits(userPlan)
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
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
          
          // Freeプランの場合、当月より前の週に移動できない
          if (!planLimits.hasPastCalendar) {
            const newMonth = newDate.getMonth()
            const newYear = newDate.getFullYear()
            
            if (newYear < currentYear || (newYear === currentYear && newMonth < currentMonth)) {
              setShowPlanLimitModal(true)
              return prevDate // 移動しない
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