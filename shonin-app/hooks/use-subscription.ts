"use client"

import { useState, useEffect } from "react"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType, SubscriptionInfo } from "@/types/subscription"
import { safeError } from "@/lib/safe-logger"

/**
 * サブスクリプション情報を取得するクライアントサイドフック
 */
export function useSubscription() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations()

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        setLoading(true)
        const info = await getSubscriptionInfo()
        setSubscriptionInfo(info)
      } catch (err) {
        safeError('Failed to fetch subscription info', err)
        // Server Actionsのエラーメッセージは無視して、常に多言語対応メッセージを表示
        setError(t('subscription.fetch_error'))
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionInfo()
  }, [t])

  return {
    subscriptionInfo,
    userPlan: subscriptionInfo?.subscriptionStatus || 'free' as PlanType,
    loading,
    error,
  }
}

