"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { LogOut } from "lucide-react"
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
import { useTranslations } from 'next-intl'

export function LogoutSection() {
  const { signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const t = useTranslations()
  
  // ログアウト確認用の状態
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  // ログアウト確認ダイアログの処理
  const handleLogoutConfirm = async () => {
    setOperationError(null) // エラーをリセット
    try {
      await signOut()
      // ログアウト後にログインページにリダイレクト（ロケール対応）
      router.push(`/${locale}/login`)
    } catch (error) {
      // Toast通知ではなく、エラーステートに設定
      setOperationError(t('settings.logout_error'))
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-gray-300">{t('settings.logout')}</Label>
      </div>
      
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {t('settings.logout')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              {t('settings.logout_confirmation')}
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
            
            <AlertDialogDescription className="text-gray-300">
              {t('settings.logout_message')}
              <br />
              {t('settings.logout_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 hover:text-white"
            >
              {t('settings.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('settings.logout')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 