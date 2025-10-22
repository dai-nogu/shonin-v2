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
  const { showError } = useToast()
  const t = useTranslations()
  
  // ログアウト確認用の状態
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ログアウト確認ダイアログの処理
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // ログアウト後にログインページにリダイレクト（ロケール対応）
      router.push(`/${locale}/login`)
    } catch (error) {
      showError(t('settings.logout_error'))
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-gray-700">{t('settings.logout')}</Label>
      </div>
      
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            {t('settings.logout')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-white border-gray-300 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              {t('settings.logout_confirmation')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700">
              {t('settings.logout_message')}
              <br />
              {t('settings.logout_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white border-gray-300 text-gray-700 hover:bg-white hover:border-gray-400"
            >
              {t('settings.back')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  )
} 