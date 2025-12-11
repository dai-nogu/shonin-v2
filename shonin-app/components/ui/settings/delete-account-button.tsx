"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/common/button"
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

export function DeleteAccountButton() {
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
        // アカウント削除時は全てのストレージをクリア
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          
          // IndexedDB のクリア（Supabaseが使用している可能性がある）
          if (window.indexedDB) {
            const databases = await window.indexedDB.databases()
            databases.forEach(db => {
              if (db.name) {
                window.indexedDB.deleteDatabase(db.name)
              }
            })
          }
        }
        
        await signOut()
        showSuccess(t('settings.account_deleted_message'))
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
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-transparent border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all duration-300"
        >
          {t('settings.account_deletion')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent 
        className="bg-gray-900/95 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-2xl"
        onOverlayClick={() => setDeleteDialogOpen(false)}
        onInteractOutside={(e) => {
          e.preventDefault()
          setDeleteDialogOpen(false)
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          setDeleteDialogOpen(false)
        }}
      >
        <AlertDialogHeader>
          <button
            onClick={() => setDeleteDialogOpen(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <AlertDialogTitle className="text-red-400 text-xl font-bold">
            {t('settings.account_deletion_confirmation')}
          </AlertDialogTitle>

          {/* エラー表示 */}
          {operationError && (
            <div className="p-4 bg-red-900 border border-red-700 rounded-lg mb-4">
              <p className="text-red-300 font-semibold text-center mb-2">{operationError}</p>
              <p className="text-red-400 text-sm text-center">
                {t('common.reload_and_retry')}
              </p>
            </div>
          )}
        </AlertDialogHeader>
        
        <div className="space-y-4">
          {/* 有料プランの残り日数警告 */}
          {subscriptionStatus === 'standard' && remainingDays > 0 && (
            <div className="space-y-2">
              <div className="text-yellow-400 font-bold text-lg">
                {t('settings.subscription_warning_title')}
              </div>
              <div className="text-white font-semibold">
                {t('settings.remaining_days_warning', { days: remainingDays })}
              </div>
              <p className="text-sm text-gray-300">
                {t('settings.deletion_immediate_effect')}
              </p>
              <p className="text-sm text-gray-300">
                <strong className="text-emerald-400">{t('settings.cancel_plan_only_hint_bold')}</strong>
              </p>
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-4">
            <div className="text-red-400 font-medium mb-1">
              {t('settings.important_warning')}
            </div>
            <ul className="text-sm space-y-1 text-gray-300">
              <li>{t('settings.warning_irreversible')}</li>
            </ul>
          </div>
          <div className="text-sm text-gray-300">
            {t('settings.confirm_deletion')}
          </div>
        </div>

        <AlertDialogFooter className="flex justify-end">
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-destructive text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}

