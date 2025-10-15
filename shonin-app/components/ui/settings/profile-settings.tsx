"use client"

import { useState, useEffect } from "react"
import { User, Edit2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"

interface ProfileSettingsProps {
  initialSubscriptionInfo?: {
    subscriptionStatus: 'free' | 'standard'
    currentPeriodEnd: string | null
  }
  initialUserProfile?: any
}

export function ProfileSettings({ initialSubscriptionInfo, initialUserProfile }: ProfileSettingsProps) {
  const { user } = useAuth()
  const { profile, updateUserName } = useUserProfile()
  const t = useTranslations()
  
  // 編集モードの管理
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
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
      }
      fetchSubscriptionInfo()
    }
  }, [initialSubscriptionInfo])

  // 保存ハンドラー
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const success = await updateUserName(name)
      if (success) {
      }
    } catch (error) {
      // エラーは useUserProfile hook で既に処理されているので、重複処理は削除
    } finally {
      setIsSaving(false)
    }
  }

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
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">
            {isEditingProfile ? t('settings.profile_edit') : t('settings.profile')}
          </CardTitle>
          <div className="flex space-x-2">
            {!isEditingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(profile || initialUserProfile) && subscriptionStatus !== null ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">{t('settings.name')}</Label>
                {isEditingProfile ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                ) : (
                  <div className="text-white">{name || t('common.not_set')}</div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">{t('settings.email')}</Label>
                <div className="text-white">{email}</div>
              </div>
            </div>

            {/* サブスクリプション情報 */}
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label className="text-gray-300">{t('settings.current_plan')}</Label>
                <div className="flex items-center">
                  {subscriptionStatus === 'standard' ? (
                    <span className="text-white text-sm font-semibold">
                      Standard
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm font-semibold rounded-full">
                      Free
                    </span>
                  )}
                </div>
              </div>
              
              {subscriptionStatus === 'standard' && currentPeriodEnd && (
                <div className="space-y-2">
                  <Label className="text-gray-300">{t('settings.next_billing_date')}</Label>
                  <div className="text-white">
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
                    variant="outline"
                    className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    サブスクリプション管理
                  </Button>
                </div>
              )}
              
              {subscriptionStatus === 'free' && (
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400">
                    {t('settings.upgrade_to_standard')}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">{t('settings.name')}</Label>
              <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">{t('settings.email')}</Label>
              <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="space-y-2 mt-6">
              <Label className="text-gray-300">{t('settings.current_plan')}</Label>
              <div className="h-8 w-20 bg-gray-800 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}
        
        {/* 編集中のボタン */}
        {isEditingProfile && (
          <div className="flex space-x-3 mt-6">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('settings.saving')}</span>
                </div>
              ) : (
                t('settings.save')
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
              disabled={isSaving}
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              {t('settings.cancel')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 