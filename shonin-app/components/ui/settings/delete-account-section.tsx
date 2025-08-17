"use client"

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/common/button'
import { Label } from '@/components/ui/common/label'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/settings/alert-dialog'

export function DeleteAccountSection() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    
    try {
      // 現在のセッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('認証が必要です。再度ログインしてください。')
        return
      }

      // Step 1: データベース関数を使用してStorageオブジェクトを削除
      console.log('Storageのメディアファイルを削除中...')
      const { data: storageDeleteResult, error: storageDeleteError } = await supabase.rpc('handle_delete_user_created_objects')
      
      if (storageDeleteError) {
        console.error('Storageファイル削除エラー:', storageDeleteError)
        alert('ファイルの削除に失敗しました。続行しますか？')
      } else if (storageDeleteResult) {
        console.log('Storageのファイルが削除されました')
      }

      // Step 2: サーバーサイドでauth.userとデータベースレコードを削除
      console.log('ユーザーアカウントを削除中...')
      const response = await fetch('/api/deleteUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        }
      })

      if (response.ok) {
        await signOut()
        alert('アカウントとすべてのデータが削除されました')
        // アカウント削除後にログインページにリダイレクト
        router.push('/login')
      } else {
        const error = await response.json()
        console.error('アカウント削除エラー:', error)
        alert('アカウントの削除に失敗しました')
      }
    } catch (error) {
      console.error('アカウント削除エラー:', error)
      alert('アカウントの削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-red-400">アカウント削除</Label>
        <p className="text-sm text-gray-400">⚠️ この操作は取り消しできません</p>
        <p className="text-sm text-gray-400">すべてのデータが完全に削除されます。</p>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline"
            className="bg-red-950 border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            アカウント削除
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center space-x-2">
              <Trash2 className="w-5 h-5" />
              <span>アカウント削除の確認</span>
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