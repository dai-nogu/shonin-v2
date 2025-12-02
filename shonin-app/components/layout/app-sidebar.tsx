"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Calendar, Target, Settings, CreditCard, LogOut, User } from "lucide-react"
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
  const [operationError, setOperationError] = useState<string | null>(null)
  const t = useTranslations()
  const { user, signOut, loading } = useAuth()

  // ユーザー名を取得（Googleアカウントの名前を使用）
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ''

  // next-intlを使用したメニューアイテム（設定とプランを削除）
  const menuItems = [
    {
      title: t('navigation.dashboard'),
      url: `/${locale}/dashboard`,
      icon: Home,
      id: "dashboard",
    },
    {
      title: t('navigation.calendar'),
      url: `/${locale}/calendar/month`,
      icon: Calendar,
      id: "calendar",
    },
    {
      title: t('navigation.goals'),
      url: `/${locale}/goals`,
      icon: Target,
      id: "goals",
    },
  ]

  // ログアウト確認ダイアログの処理
  const handleLogoutConfirm = async () => {
    setOperationError(null)
    try {
      await signOut()
      router.push(`/${locale}/login`)
    } catch (error) {
      setOperationError(t('settings.logout_error'))
    }
  }

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (!pathname) return
    
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    if (pathWithoutLocale === "/session") {
      // セッション中はどのメニューもアクティブにしない
      setActivePage("")
    } else if (pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/") {
      setActivePage("dashboard")
    } else if (pathWithoutLocale === "/calendar" || pathWithoutLocale.startsWith("/calendar/")) {
      setActivePage("calendar")
    } else if (pathWithoutLocale === "/goals") {
      setActivePage("goals")
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
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="border-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SHONIN</h1>
          </div>
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
                    className="text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600">
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
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer"
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
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
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

      <SidebarRail />
    </Sidebar>
  )
}
