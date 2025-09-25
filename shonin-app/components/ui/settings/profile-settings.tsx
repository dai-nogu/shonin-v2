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

export function ProfileSettings() {
  const { user } = useAuth()
  const { profile, updateUserName } = useUserProfile()
  const t = useTranslations()
  
  // 編集モードの管理
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // ユーザー情報（データベースから取得）
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email || "")

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
    }
  }, [profile])

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">{t('settings.name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditingProfile}
              className="bg-gray-800 border-gray-700 text-white disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">{t('settings.email')}</Label>
            <Input
              type="email"
              value={email}
              disabled={true}
              className="bg-gray-800 border-gray-700 text-white disabled:opacity-50"
              placeholder={t('settings.email_placeholder')}
            />
          </div>
        </div>
        
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