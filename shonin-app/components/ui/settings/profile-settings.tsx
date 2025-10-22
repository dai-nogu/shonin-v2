"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"

interface ProfileSettingsProps {
  initialSubscriptionInfo?: {
    subscriptionStatus: 'free' | 'standard'
    currentPeriodEnd: string | null
    cancelAtPeriodEnd?: boolean
    canceledAt?: string | null
  }
  initialUserProfile?: any
}

export function ProfileSettings({ initialSubscriptionInfo, initialUserProfile }: ProfileSettingsProps) {
  const { user } = useAuth()
  const { profile } = useUserProfile()
  const t = useTranslations()
  
  // ユーザー情報（データベースから取得）
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  
  // サブスクリプション情報
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'standard' | null>(
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
        setCancelAtPeriodEnd(info.cancelAtPeriodEnd)
        setCanceledAt(info.canceledAt)
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
      console.error("Error:", error);
    }
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">
          {t('settings.profile')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(profile || initialUserProfile) && subscriptionStatus !== null ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">{t('settings.name')}</Label>
                <div className="text-gray-900">{name || t('common.not_set')}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">{t('settings.email')}</Label>
                <div className="text-gray-900">{email}</div>
              </div>
            </div>

            {/* サブスクリプション情報 */}
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label className="text-gray-700">{t('settings.current_plan')}</Label>
                <div className="flex items-center gap-2">
                  {subscriptionStatus === 'standard' ? (
                    <>
                      <span className="text-gray-900 text-sm font-semibold">
                        Standard
                      </span>
                      {cancelAtPeriodEnd && currentPeriodEnd && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
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
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 text-sm font-semibold rounded-full">
                      Free
                    </span>
                  )}
                </div>
              </div>
              
              {subscriptionStatus === 'standard' && currentPeriodEnd && !cancelAtPeriodEnd && (
                <div className="space-y-2">
                  <Label className="text-gray-700">{t('settings.next_billing_date')}</Label>
                  <div className="text-gray-900">
                    {new Date(currentPeriodEnd).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}

              {subscriptionStatus === 'standard' && (
                <div className="pt-2">
                  <Button
                    onClick={handleManageSubscription}
                    className="bg-gray-900 text-white hover:bg-gray-800"
                  >
                    {t('settings.manage_subscription')}
                  </Button>
                </div>
              )}
              
              {subscriptionStatus === 'free' && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    {t('settings.upgrade_to_standard')}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">{t('settings.name')}</Label>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">{t('settings.email')}</Label>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2 mt-6">
              <Label className="text-gray-700">{t('settings.current_plan')}</Label>
              <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 