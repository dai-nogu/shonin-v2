"use client"

import { useState } from "react"
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

export function DeleteAccountSection() {
  const { signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { showError, showSuccess, showWarning } = useToast()
  const [supabase] = useState(() => createClient())
  const t = useTranslations()

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      // 現在のセッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        showError('認証が必要です。ログインしてください。')
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
        showError(t('settings.account_deletion_error'))
      }
    } catch (error) {
      // レスポンスのパースに失敗した場合やネットワークエラーの場合
      showError('エラーが発生しました。再度お試しください。')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-red-400">{t('settings.account_deletion')}</Label>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline"
            className="bg-red-950 border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t('settings.account_deletion')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <span>{t('settings.account_deletion_confirmation')}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-950/20 border border-red-800/50 rounded-lg">
              <div className="text-red-300 font-medium mb-2">⚠️ 重要な警告</div>
              <ul className="text-sm space-y-1 text-gray-300">
                <li>• この操作は取り消すことができません</li>
                <li>• すべてのアクティビティデータが削除されます</li>
                <li>• セッション履歴が完全に削除されます</li>
                <li>• 目標設定とAI分析データも削除されます</li>
              </ul>
            </div>
            <div className="text-sm text-gray-300">
              本当にアカウントを削除しますか？
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              いいえ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>削除中...</span>
                </div>
              ) : (
                "削除する"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 