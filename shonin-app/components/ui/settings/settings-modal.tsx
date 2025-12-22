"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { X, Globe, LogOut, Trash2, CreditCard } from "lucide-react"
import { useTranslations } from 'next-intl'
import { useAuth } from "@/contexts/auth-context"
import { useSessions } from "@/contexts/sessions-context"
import { useToast } from "@/contexts/toast-context"
import { createClient } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog"
import { VisuallyHidden } from "@/components/ui/common/visually-hidden"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/settings/alert-dialog"
import { Button } from "@/components/ui/common/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import type { PlanType } from "@/types/subscription"

const SUPPORTED_LOCALES = [
  { code: 'ja', key: 'ja' },
  { code: 'en', key: 'en' }
] as const

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const currentLocale = locale
  const t = useTranslations()
  const { user, signOut } = useAuth()
  const { isSessionActive } = useSessions()
  const { showSuccess, showWarning } = useToast()
  const [supabase] = useState(() => createClient())

  // ユーザー情報
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ''
  const userEmail = user?.email || ''
  const userPlan = t('plan.starter')

  // ログアウト関連
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  // 退会関連
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // サブスクリプション情報
  const [subscriptionStatus, setSubscriptionStatus] = useState<PlanType | null>(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null)
  const [remainingDays, setRemainingDays] = useState<number>(0)

  // サブスクリプション情報を取得
  useEffect(() => {
    if (!open) return

    const fetchSubscriptionInfo = async () => {
      const info = await getSubscriptionInfo()
      setSubscriptionStatus(info.subscriptionStatus)
      setCurrentPeriodEnd(info.currentPeriodEnd)
      
      if (info.subscriptionStatus === 'standard' && info.currentPeriodEnd) {
        const now = new Date()
        const endDate = new Date(info.currentPeriodEnd)
        const diffTime = endDate.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        setRemainingDays(diffDays > 0 ? diffDays : 0)
      }
    }
    fetchSubscriptionInfo()
  }, [open])

  // 言語変更
  const handleLocaleChange = (newLocale: string) => {
    if (isSessionActive) return
    const newPath = `/${newLocale}/dashboard`
    router.push(newPath)
    onOpenChange(false)
  }

  // ログアウト処理
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut()
      router.push(`/${locale}/login`)
      onOpenChange(false)
    } catch (error) {
      setLogoutError(t('settings.logout_error'))
      setIsLoggingOut(false)
    }
  }

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setDeleteError(t('errors.authentication_required'))
        return
      }

      // ストレージオブジェクトを削除
      const { error: storageDeleteError } = await supabase.rpc('handle_delete_user_created_objects')
      
      if (storageDeleteError) {
        showWarning('ファイルの削除に失敗しました。続行しますか?')
      }

      // ユーザーとデータベースレコードを削除
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        // ストレージをクリア
        if (typeof window !== 'undefined') {
          localStorage.clear()
          sessionStorage.clear()
          
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
        router.push(`/${locale}/login`)
        onOpenChange(false)
      } else {
        setDeleteError(t('settings.account_deletion_error'))
      }
    } catch (error) {
      setDeleteError(t('errors.generic_retry'))
    } finally {
      setIsDeleting(false)
      if (!deleteError) {
        setDeleteDialogOpen(false)
      }
    }
  }

  return (
    <>
      {/* 処理中のフルスクリーンオーバーレイ */}
      {(isLoggingOut || isDeleting) && (
        <div className="fixed inset-0 z-modal bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg font-medium">
              {isLoggingOut ? t('settings.logging_out') : t('settings.deleting')}
            </p>
            <p className="text-gray-300 text-sm">{t('common.please_wait')}</p>
          </div>
        </div>
      )}

      {/* メイン設定モーダル */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="border border-gray-700 text-white max-w-lg max-h-[90vh] overflow-y-auto"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, hsl(240, 25%, 13%) 0%, transparent 60%),
              radial-gradient(circle at 0% 0%, hsl(260, 25%, 10%) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, hsl(220, 25%, 10%) 0%, transparent 50%)
            `,
            backgroundColor: 'hsl(240, 10%, 3.9%)'
          }}
        >
          <VisuallyHidden>
            <DialogTitle>{t('settings.title')}</DialogTitle>
          </VisuallyHidden>
          <div className="space-y-4">
            {/* ユーザー情報セクション */}
            <section>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700">
                    <span className="text-white text-xl font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{userName}</div>
                    <div className="text-xs text-gray-400">{userEmail}</div>
                  </div>
                </div>
                <div className="flex flex-col items-start space-y-2">
                  <span className="text-xs text-white hover:text-accent-foreground border border-gray-700 rounded-full px-2 py-1">{userPlan}</span>
                  <Button
                    onClick={() => {
                      router.push(`/${locale}/plan`)
                      onOpenChange(false)
                    }}
                    className="px-4 py-2 text-xs text-white rounded-md"
                  >
                    {t('settings.manage_plan')}
                  </Button>
                </div>
              </div>
            </section>

            {/* 言語設定セクション */}
            <section className="space-y-1">
              <div className="pb-1 border-gray-700">
                <h3 className="text-sm text-gray-400">
                  {t('settings.language')}
                </h3>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-gray-700 p-5 shadow-lg">
                <p className="text-sm text-white">
                  {t('settings.select_language')}
                </p>
                <Select 
                  value={currentLocale} 
                  onValueChange={handleLocaleChange}
                  disabled={isSessionActive}
                >
                  <SelectTrigger className={`w-[23%] bg-transparent border-gray-700 hover:border-gray-600 text-white hover:text-accent-foreground ${
                    isSessionActive ? 'opacity-50' : ''
                  }`}>
                    <SelectValue>
                      {t(`languages.${currentLocale}`) || currentLocale}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-700">
                    {SUPPORTED_LOCALES.map((locale) => (
                      <SelectItem 
                        key={locale.code} 
                        value={locale.code}
                        className="text-white hover:bg-gray-600 focus:bg-gray-600"
                      >
                        {t(`languages.${locale.key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isSessionActive && (
                <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                  <p className="text-red-300 text-sm">{t('settings.language_disabled_message')}</p>
                </div>
              )}
            </section>

            {/* アカウント管理セクション */}
            <section className="space-y-1">
              <div className="pb-1 border-gray-700">
                <h3 className="text-sm text-gray-400">
                  {t('settings.account_management')}
                </h3>
              </div>
              <div className="space-y-3 rounded-xl border border-gray-700 p-5 shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                  <p className="text-sm text-white">
                    {t('settings.logout')}
                  </p>
                  <Button
                    onClick={() => {
                      onOpenChange(false)
                      setLogoutDialogOpen(true)
                    }}
                    className="px-6 py-2 bg-transparent hover:bg-transparent text-white hover:text-accent-foreground border border-gray-700 hover:border-gray-600 rounded-md"
                  >
                    {t('settings.logout')}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white">
                    {t('settings.account_deletion')}
                  </p>
                  <Button
                    onClick={() => {
                      onOpenChange(false)
                      setDeleteDialogOpen(true)
                    }}
                    variant="outline"
                    className="px-6 py-2 w-[23%] bg-transparent border-red-700 text-white hover:bg-transparent hover:border-red-600 rounded-md"
                  >
                    {t('settings.account_deletion')}
                  </Button>
                </div>
              </div>
            </section>

            {/* フッター情報 */}
            <section>
              <div className="flex justify-center items-center space-x-3 text-sm">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {t('settings.contact')}
                </a>
                <span className="text-gray-500">|</span>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  {t('settings.updates')}
                </a>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* ログアウト確認ダイアログ */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={(open) => !isLoggingOut && setLogoutDialogOpen(open)}>
        <AlertDialogContent 
          className="bg-gray-800 border-gray-700 text-white"
        >
          <AlertDialogHeader>
            <button
              onClick={() => !isLoggingOut && setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
              className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
            <AlertDialogTitle className="text-red-400">
              {t('settings.logout_confirmation')}
            </AlertDialogTitle>

            {logoutError && (
              <div className="p-4 bg-red-900 border border-red-700 rounded-lg mb-4">
                <p className="text-red-300 font-semibold text-center mb-2">{logoutError}</p>
                <p className="text-red-400 text-sm text-center">
                  {t('common.reload_and_retry')}
                </p>
              </div>
            )}
            
            <AlertDialogDescription className="text-gray-300">
              {t('settings.logout_message')}
              <br />
              {t('settings.logout_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="flex justify-end">
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="bg-red-500 hover:bg-destructive text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('settings.logging_out')}</span>
                </div>
              ) : (
                t('settings.logout')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* アカウント削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => !isDeleting && setDeleteDialogOpen(open)}>
        <AlertDialogContent 
          className="bg-gray-900/95 border border-white/10 text-white backdrop-blur-xl shadow-2xl rounded-2xl"
        >
          <AlertDialogHeader>
            <button
              onClick={() => !isDeleting && setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
            </button>
            <AlertDialogTitle className="text-red-400 text-xl font-bold">
              {t('settings.account_deletion_confirmation')}
            </AlertDialogTitle>

            {deleteError && (
              <div className="p-4 bg-red-900 border border-red-700 rounded-lg mb-4">
                <p className="text-red-300 font-semibold text-center mb-2">{deleteError}</p>
                <p className="text-red-400 text-sm text-center">
                  {t('common.reload_and_retry')}
                </p>
              </div>
            )}
          </AlertDialogHeader>
          
          <div className="space-y-4">
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
            
            <div className="border-t border-gray-700 pt-4">
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
    </>
  )
}

