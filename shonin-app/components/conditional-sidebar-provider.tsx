"use client"

import type React from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSessions } from "@/contexts/sessions-context"
import { useUI } from "@/contexts/ui-context"

export function ConditionalSidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { isSessionActive } = useSessions()
  const { isGoalEditing, isGoalAdding } = useUI()

  // 認証が必要なページかどうかを判定
  const isAuthPage = pathname === '/login'
  const isRootPage = pathname === '/'
  const isGoalsPage = pathname === '/goals'
  const isSessionPage = pathname === '/session'

  // 現在のページを判定
  const getCurrentPage = () => {
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname === '/calendar') return 'calendar'
    if (pathname === '/goals') return 'goals'
    if (pathname === '/settings') return 'settings'
    if (pathname === '/session') return 'session'
    return 'dashboard'
  }

  const currentPage = getCurrentPage()

  // ページ変更ハンドラー
  const handlePageChange = (pageId: string) => {
    switch (pageId) {
      case 'dashboard':
        router.push('/dashboard')
        break
      case 'calendar':
        router.push('/calendar')
        break
      case 'goals':
        router.push('/goals')
        break
      case 'settings':
        router.push('/settings')
        break
      case 'session':
        if (isSessionActive) {
          router.push('/session')
        }
        break
    }
  }

  // ログインページまたはルートページの場合はサイドバープロバイダーなし
  if (isAuthPage || isRootPage) {
    return <>{children}</>
  }

  // 認証済みユーザーのページ
  if (user) {
    // セッションページは特別な処理（サイドバーありでアクセス可能だが、フルスクリーン表示）
    if (isSessionPage) {
      return (
        <SidebarProvider>
          <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
          <SidebarInset>
            <div className="md:min-h-screen bg-gray-950 text-white">
              {children}
            </div>
          </SidebarInset>
          {/* モバイル用下部固定ナビゲーション */}
          <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        </SidebarProvider>
      )
    }

    // その他のページはサイドバーとボトムナビゲーション付き
    return (
      <SidebarProvider>
        {/* 目標編集中・追加中はサイドバーを非表示 */}
        {!(isGoalsPage && (isGoalEditing || isGoalAdding)) && (
          <AppSidebar currentPage={currentPage} onPageChange={handlePageChange} />
        )}
        <SidebarInset>
          <div className={`md:min-h-screen bg-gray-950 text-white md:pb-0 ${
            isGoalsPage && (isGoalEditing || isGoalAdding) ? "pb-0" : "pb-20"
          }`}>
            {children}
          </div>
        </SidebarInset>
        {/* モバイル用下部固定ナビゲーション - 目標編集中・追加中は非表示 */}
        {!(isGoalsPage && (isGoalEditing || isGoalAdding)) && (
          <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        )}
      </SidebarProvider>
    )
  }

  // 未認証の場合は何も表示しない
  return <>{children}</>
} 