"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Settings, CreditCard, LogOut, User, X } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/common/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/settings/alert-dialog"
import { ActiveUsersBadge } from "@/components/ui/marketing/active-users-badge"

interface AppSidebarProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function AppSidebar({ currentPage = "dashboard", onPageChange }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [activePage, setActivePage] = useState(currentPage)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const t = useTranslations()
  const { user, signOut, loading } = useAuth()

  // ユーザー名を取得（Googleアカウントの名前を使用）
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  // next-intlを使用したメニューアイテム（ダッシュボードのみ）
  const menuItems = [
    {
      title: t('navigation.dashboard'),
      url: `/${locale}/dashboard`,
      icon: Home,
      id: "dashboard",
    },
  ]

  // ログアウト確認ダイアログの処理
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    setOperationError(null)
    try {
      await signOut()
      router.push(`/${locale}/login`)
    } catch (error) {
      setOperationError(t('settings.logout_error'))
      setIsLoggingOut(false)
    }
  }

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (!pathname) return
    
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    if (pathWithoutLocale === "/session") {
      // セッション中はどのメニューもアクティブにしない
      setActivePage("")
    } else if (pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/" || pathWithoutLocale === "/goals" || pathWithoutLocale.startsWith("/goals/")) {
      setActivePage("dashboard")
    } else if (pathWithoutLocale === "/plan" || pathWithoutLocale.startsWith("/settings")) {
      // プランや設定ページではサイドバーのメニューをアクティブにしない
      setActivePage("")
    } else {
      // パスが一致しない場合のみcurrentPageを使用
      setActivePage(currentPage)
    }
  }, [pathname, currentPage, locale])

  const handlePageChange = (pageId: string, url: string) => {
    setActivePage(pageId)
    router.push(url)
    onPageChange?.(pageId)
  }

  return (
    <>
      {/* 処理中のフルスクリーンオーバーレイ */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-lg font-medium">{t('settings.logging_out')}</p>
            <p className="text-gray-300 text-sm">{t('common.please_wait')}</p>
          </div>
        </div>
      )}

      <Sidebar className="border-r border-gray-800">
        <SidebarHeader className="border-gray-800 p-2">
        <div className="flex items-center space-x-2 pl-2">
          <div className="w-[100px] bg-transparent">
            <img 
              src="/logo.png" 
              alt="Shonin Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        
        {/* アクティブユーザー数バッジ */}
        <div className="mt-6">
          <ActiveUsersBadge />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handlePageChange(item.id, item.url)}
                    isActive={activePage === item.id}
                    className="text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 ease-out active:scale-[0.98]"
                  >
                    <item.icon 
                      className={`w-4 h-4 transition-all duration-200 ${
                        activePage === item.id ? 'text-emerald-500 scale-110' : ''
                      }`}
                    />
                    <span>{item.title}</span>
                    {/* アクティブインジケーター */}
                    {activePage === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-700 rounded-r-full transition-all duration-300" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ユーザーメニュー */}
      <SidebarFooter className="border-t border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 data-[state=open]:bg-gray-800 data-[state=open]:text-white"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    {loading ? (
                      <span className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                    ) : (
                      <span className="truncate font-medium">{userName}</span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-gray-800 border-gray-700"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem
                  className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/${locale}/plan`)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('navigation.plan')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-gray-300 hover:text-white hover:bg-gray-700 cursor-pointer"
                  onClick={() => router.push(`/${locale}/settings`)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('navigation.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem
                  className="text-red-400 focus:text-white focus:bg-red-500 data-[highlighted]:text-white data-[highlighted]:bg-red-500 cursor-pointer transition-all duration-200"
                  onClick={() => setLogoutDialogOpen(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('settings.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* ログアウト確認ダイアログ */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={(open) => !isLoggingOut && setLogoutDialogOpen(open)}>
        <AlertDialogContent 
          className="bg-gray-800 border-gray-700 text-white"
          onInteractOutside={(e) => {
            if (isLoggingOut) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isLoggingOut) {
              e.preventDefault()
            }
          }}
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

      <SidebarRail />
      </Sidebar>
    </>
  )
}
