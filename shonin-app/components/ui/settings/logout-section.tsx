"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export function LogoutSection() {
  const { signOut } = useAuth()
  const router = useRouter()
  const { showError } = useToast()
  
  // ログアウト確認用の状態
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // ログアウト確認ダイアログの処理
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // ログアウト後にログインページにリダイレクト
      router.push('/login')
    } catch (error) {
      showError("ログアウト中にエラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-gray-300">ログアウト</Label>
        <p className="text-sm text-gray-400">アカウントからサインアウトします</p>
        <p className="text-sm text-gray-400">ログアウト後は、再度ログインが必要になります。</p>
      </div>
      
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            ログアウト
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-yellow-400 flex items-center space-x-2">
              <LogOut className="w-5 h-5" />
              <span>ログアウトの確認</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              本当にログアウトしますか？
              <br />
              ログアウト後は、再度ログインが必要になります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              戻る
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoggingOut ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>ログアウト中...</span>
                </div>
              ) : (
                "ログアウト"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 