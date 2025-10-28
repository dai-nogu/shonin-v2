"use client"

import { useState, useEffect } from "react"
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType, SubscriptionInfo } from "@/types/subscription"

/**
 * サブスクリプション情報を取得するクライアントサイドフック
 */
export function useSubscription() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        setLoading(true)
        const info = await getSubscriptionInfo()
        setSubscriptionInfo(info)
      } catch (err) {
        console.error('Failed to fetch subscription info:', err)
        setError(err instanceof Error ? err.message : 'サブスクリプション情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionInfo()
  }, [])

  return {
    subscriptionInfo,
    userPlan: subscriptionInfo?.subscriptionStatus || 'free' as PlanType,
    loading,
    error,
  }
}

