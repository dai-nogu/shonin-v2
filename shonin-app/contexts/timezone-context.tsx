"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { detectUserTimezone, TIMEZONES } from "@/lib/timezone-utils"

interface TimezoneContextType {
  timezone: string
  setTimezone: (timezone: string) => void
  isAutoDetect: boolean
  setIsAutoDetect: (autoDetect: boolean) => void
  loading: boolean
  error: string | null
  detectAndSetTimezone: () => void

}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined)

export function useTimezone() {
  const context = useContext(TimezoneContext)
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider')
  }
  return context
}

interface TimezoneProviderProps {
  children: ReactNode
}

export function TimezoneProvider({ children }: TimezoneProviderProps) {
  const [timezone, setTimezoneState] = useState<string>('Asia/Tokyo')
  const [isAutoDetect, setIsAutoDetect] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // 初期化時にタイムゾーン設定を読み込み
  useEffect(() => {
    const initializeTimezone = async () => {
      try {
        setLoading(true)
        setError(null)

        // ローカルストレージから設定を読み込み
        const savedTimezone = localStorage.getItem('shonin-timezone')
        const savedAutoDetect = localStorage.getItem('shonin-auto-detect-timezone')

        if (savedAutoDetect === 'false') {
          // 自動検出が無効の場合は保存されたタイムゾーンを使用
          setIsAutoDetect(false)
          if (savedTimezone) {
            setTimezoneState(savedTimezone)
          }
        } else {
          // 自動検出が有効の場合はブラウザのタイムゾーンを使用
          setIsAutoDetect(true)
          const detectedTimezone = detectUserTimezone()
          setTimezoneState(detectedTimezone)
          
          // 検出したタイムゾーンを保存
          localStorage.setItem('shonin-timezone', detectedTimezone)
        }

        // TODO: 将来的にはSupabaseからユーザー設定を読み込む
        // const { data: userProfile } = await supabase
        //   .from('users')
        //   .select('timezone')
        //   .eq('id', user.id)
        //   .single()
        // 
        // if (userProfile?.timezone) {
        //   setTimezoneState(userProfile.timezone)
        // }

      } catch (err) {
        setError('タイムゾーン設定の読み込みに失敗しました')
        // エラーの場合はデフォルトのタイムゾーンを使用
        setTimezoneState('Asia/Tokyo')
      } finally {
        setLoading(false)
      }
    }

    initializeTimezone()
  }, [])

  const setTimezone = (newTimezone: string) => {
    try {
      setTimezoneState(newTimezone)
      localStorage.setItem('shonin-timezone', newTimezone)
      
      // 手動設定の場合は自動検出を無効にする
      if (isAutoDetect) {
        setIsAutoDetect(false)
        localStorage.setItem('shonin-auto-detect-timezone', 'false')
      }

      // TODO: 将来的にはSupabaseにも保存
      // await supabase
      //   .from('users')
      //   .update({ timezone: newTimezone })
      //   .eq('id', user.id)

    } catch (err) {
      setError('タイムゾーン設定の保存に失敗しました')
    }
  }

  const setIsAutoDetectWrapper = (autoDetect: boolean) => {
    try {
      setIsAutoDetect(autoDetect)
      localStorage.setItem('shonin-auto-detect-timezone', autoDetect.toString())

      if (autoDetect) {
        // 自動検出を有効にした場合は現在のタイムゾーンを検出
        const detectedTimezone = detectUserTimezone()
        setTimezoneState(detectedTimezone)
        localStorage.setItem('shonin-timezone', detectedTimezone)
      }
    } catch (err) {
      setError('自動検出設定の保存に失敗しました')
    }
  }

  const detectAndSetTimezone = () => {
    try {
      const detectedTimezone = detectUserTimezone()
      setTimezoneState(detectedTimezone)
      localStorage.setItem('shonin-timezone', detectedTimezone)
      setError(null)
    } catch (err) {
      setError('タイムゾーンの自動検出に失敗しました')
    }
  }



  const value: TimezoneContextType = {
    timezone,
    setTimezone,
    isAutoDetect,
    setIsAutoDetect: setIsAutoDetectWrapper,
    loading,
    error,
    detectAndSetTimezone
  }

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  )
} 