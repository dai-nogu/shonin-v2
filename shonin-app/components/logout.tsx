"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
 
    } catch (error) {
      console.error('ログアウトに失敗しました:', error)
      // TODO: エラートーストを表示
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className={className}
    >
      {children || 'ログアウト'}
    </Button>
  )
}