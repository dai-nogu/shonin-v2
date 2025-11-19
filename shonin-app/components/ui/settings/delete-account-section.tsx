"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/settings/alert-dialog"
import { useToast } from "@/contexts/toast-context"
import { createClient } from "@/lib/supabase"
import { useTranslations } from 'next-intl'
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType } from "@/types/subscription"

export function DeleteAccountSection() {
  const { signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const { showSuccess, showWarning } = useToast()
  const [supabase] = useState(() => createClient())
  const t = useTranslations()
  
  // サブスクリプション情報
  const [subscriptionStatus, setSubscriptionStatus] = useState<PlanType | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null)
  const [remainingDays, setRemainingDays] = useState<number>(0)

  // サブスクリプション情報を取得
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      const info = await getSubscriptionInfo()
      setSubscriptionStatus(info.subscriptionStatus)
      setCurrentPeriodEnd(info.currentPeriodEnd)
      
      // 残り日数を計算
      if (info.subscriptionStatus === 'standard' && info.currentPeriodEnd) {
        const now = new Date()
        const endDate = new Date(info.currentPeriodEnd)
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setRemainingDays(diffDays > 0 ? diffDays : 0)
      }
    }
    fetchSubscriptionInfo()
  }, [])

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      // 現在のセッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setOperationError(t('errors.authentication_required'))
        return
      }

      // Step 1: データベース関数を使用してStorageオブジェクトを削除
      const { data: storageDeleteResult, error: storageDeleteError } = await supabase.rpc('handle_delete_user_created_objects')
      
      if (storageDeleteError) {
        showWarning('ファイルの削除に失敗しました。続行しますか？')
      }

      // Step 2: サーバーサイドでauth.userとデータベースレコードを削除
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        await signOut()
        showSuccess('ご利用ありがとうございました。')
        // アカウント削除後にログインページにリダイレクト（ロケール対応）
        router.push(`/${locale}/login`)
      } else {
        const error = await response.json()
        setOperationError(t('settings.account_deletion_error'))
      }
    } catch (error) {
      // レスポンスのパースに失敗した場合やネットワークエラーの場合
      setOperationError(t('errors.generic_retry'))
    } finally {
      setIsDeleting(false)
      if (!operationError) {
        setDeleteDialogOpen(false)
      }
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-red-600">{t('settings.account_deletion')}</Label>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700 border"
          >
            {t('settings.account_deletion')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-white border-gray-300 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t('settings.account_deletion_confirmation')}
            </AlertDialogTitle>

            {/* エラー表示 */}
            {operationError && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-lg mb-4">
                <p className="text-red-700 font-semibold text-center mb-2">{operationError}</p>
                <p className="text-red-600 text-sm text-center">
                  {t('common.reload_and_retry')}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          
          <div className="space-y-4">
            {/* 有料プランの残り日数警告 */}
            {subscriptionStatus === 'standard' && remainingDays > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-300 rounded-lg">
                <div className="text-orange-800 font-bold mb-2 text-lg">
                  {t('settings.subscription_warning_title')}
                </div>
                <div className="text-orange-900 font-semibold mb-1">
                  {t('settings.remaining_days_warning', { days: remainingDays })}
                </div>
                <p className="text-sm text-orange-700">
                  {t('settings.deletion_immediate_effect')}
                </p>
                <p className="text-sm text-orange-700 mt-1 font-semibold">
                  {t('settings.subscription_will_be_cancelled')}
                </p>
                <p className="text-sm text-orange-700 mt-2">
                  {t('settings.cancel_plan_only_hint_prefix')}
                  <strong>{t('settings.cancel_plan_only_hint_bold')}</strong>
                  {t('settings.cancel_plan_only_hint_suffix')}
                </p>
              </div>
            )}
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 font-medium mb-2">
                {t('settings.important_warning')}
              </div>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>{t('settings.warning_irreversible')}</li>
                <li>{t('settings.warning_activity_data')}</li>
                <li>{t('settings.warning_session_history')}</li>
                <li>{t('settings.warning_goals_ai')}</li>
              </ul>
            </div>
            <div className="text-sm text-gray-700">
              {t('settings.confirm_deletion')}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900"
              disabled={isDeleting}
            >
              {t('settings.no')}
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('settings.deleting')}</span>
                </div>
              ) : (
                t('settings.delete')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 