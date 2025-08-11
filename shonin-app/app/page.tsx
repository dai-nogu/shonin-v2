"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // OAuth認証後のURLクリーンアップ
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      // OAuth認証完了後にトークンをURLから除去してダッシュボードに移動
      window.history.replaceState(null, '', '/dashboard')
      router.push('/dashboard')
      return
    }
  }, [router])

  // 認証状態に応じてリダイレクト
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // 認証済みの場合はダッシュボードにリダイレクト
        router.push('/dashboard')
      } else {
        // 未認証の場合はログインページにリダイレクト
        router.push('/login')
      }
    }
  }, [user, authLoading, router])

  // ローディング表示
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  // リダイレクト中は何も表示しない
  return null
} 