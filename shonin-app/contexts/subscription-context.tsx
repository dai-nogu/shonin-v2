"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType, SubscriptionInfo } from "@/types/subscription"
import { safeError } from "@/lib/safe-logger"

interface SubscriptionContextType {
  subscriptionInfo: SubscriptionInfo | null
  userPlan: PlanType
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

interface SubscriptionProviderProps {
  children: ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)
  const t = useTranslations()

  const fetchSubscriptionInfo = useCallback(async (force = false) => {
    // 既に取得済みで、強制更新でなければスキップ
    if (hasFetched && !force) {
      return
    }

    try {
      if (!hasFetched) {
        setLoading(true)
      }
      const info = await getSubscriptionInfo()
      setSubscriptionInfo(info)
      setHasFetched(true)
    } catch (err) {
      safeError('Failed to fetch subscription info', err)
      setError(t('subscription.fetch_error'))
    } finally {
      setLoading(false)
    }
  }, [hasFetched, t])

  // 初回マウント時のみ取得
  useEffect(() => {
    fetchSubscriptionInfo()
  }, [fetchSubscriptionInfo])

  const refresh = useCallback(async () => {
    await fetchSubscriptionInfo(true)
  }, [fetchSubscriptionInfo])

  const value: SubscriptionContextType = {
    subscriptionInfo,
    userPlan: subscriptionInfo?.subscriptionStatus || 'free' as PlanType,
    loading: loading && !hasFetched, // 初回のみローディング表示
    error,
    refresh,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider')
  }
  return context
}

