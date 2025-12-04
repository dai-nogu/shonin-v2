"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType, SubscriptionInfo } from "@/types/subscription"
import { safeError } from "@/lib/safe-logger"

interface ProfileSettingsProps {
  initialSubscriptionInfo?: SubscriptionInfo
  initialUserProfile?: any
}

export function ProfileSettings({ initialSubscriptionInfo, initialUserProfile }: ProfileSettingsProps) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const t = useTranslations()
  
  // ユーザー情報（データベースから取得）
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  
  // サブスクリプション情報
  const [subscriptionStatus, setSubscriptionStatus] = useState<PlanType | null>(
    initialSubscriptionInfo?.subscriptionStatus || null
  )
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(
    initialSubscriptionInfo?.currentPeriodEnd || null
  )
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState<boolean>(
    initialSubscriptionInfo?.cancelAtPeriodEnd || false
  )
  const [canceledAt, setCanceledAt] = useState<string | null>(
    initialSubscriptionInfo?.canceledAt || null
  )

  // ユーザー情報が更新された際に状態を同期
  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
    }
  }, [user])

  // プロフィール情報をローカル状態に同期
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
    } else if (initialUserProfile) {
      setName(initialUserProfile.name || "")
    }
  }, [profile, initialUserProfile])

  // サブスクリプション情報を取得（初期データがない場合のみ）
  useEffect(() => {
    if (!initialSubscriptionInfo) {
      const fetchSubscriptionInfo = async () => {
        const info = await getSubscriptionInfo()
        setSubscriptionStatus(info.subscriptionStatus)
        setCurrentPeriodEnd(info.currentPeriodEnd)
        setCancelAtPeriodEnd(info.cancelAtPeriodEnd ?? false)
        setCanceledAt(info.canceledAt ?? null)
      }
      fetchSubscriptionInfo()
    }
  }, [initialSubscriptionInfo])

  // サブスクリプション管理ハンドラー
  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      safeError("Error", error);
    }
  }

  return (
    <Card className="border-0 bg-transparent shadow-none max-w-xl mx-auto md:mt-32">
      <CardContent className="space-y-6 px-0 pt-0">
        {!authLoading && !profileLoading && (profile || initialUserProfile) && subscriptionStatus !== null ? (
          <>
            {/* 名前・メールアドレス（SPは縦積み、PCは横並び） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.name')}</Label>
                <div className="text-gray-300">{name || t('common.not_set')}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.email')}</Label>
                <div className="text-gray-300">{email || t('common.not_set')}</div>
              </div>
            </div>

            {/* プラン・次回更新日（SPは縦積み、PCは横並び） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.current_plan')}</Label>
                <div className="flex items-center gap-2">
                  {subscriptionStatus === 'standard' ? (
                    <>
                      <span className="text-gray-300 text-sm font-semibold">
                        Standard
                      </span>
                      {cancelAtPeriodEnd && currentPeriodEnd && (
                        <span className="px-2 py-1 bg-orange-900 text-orange-300 text-xs font-medium rounded">
                          {t('settings.cancel_scheduled_badge', {
                            date: new Date(currentPeriodEnd).toLocaleDateString(t('common.locale') || 'ja-JP', {
                              month: 'numeric',
                              day: 'numeric',
                            })
                          })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-300 text-sm font-semibold">
                      Free
                    </span>
                  )}
                </div>
              </div>
              
              {subscriptionStatus === 'standard' && currentPeriodEnd && !cancelAtPeriodEnd && (
                <div className="space-y-2">
                  <Label className="text-white text-base">{t('settings.next_billing_date')}</Label>
                  <div className="text-gray-300">
                    {new Date(currentPeriodEnd).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ボタン */}
            {subscriptionStatus === 'standard' && (
              <div className="pt-2">
                <Button
                  onClick={handleManageSubscription}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {t('settings.manage_subscription')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {/* ローディング状態（SPは縦積み、PCは横並び） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.name')}</Label>
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.email')}</Label>
                <div className="h-6 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">
              <div className="space-y-2">
                <Label className="text-white text-base">{t('settings.current_plan')}</Label>
                <div className="h-6 w-20 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 