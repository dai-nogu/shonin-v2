"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Settings, User } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { ActiveUsersBadge } from "@/components/ui/marketing/active-users-badge"
import { SettingsModal } from "@/components/ui/settings/settings-modal"

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
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const t = useTranslations()
  const { user, loading } = useAuth()

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

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (!pathname) return
    
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    if (pathWithoutLocale === "/session") {
      // セッション中はどのメニューもアクティブにしない
      setActivePage("")
    } else if (pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/" || pathWithoutLocale === "/goals" || pathWithoutLocale.startsWith("/goals/")) {
      setActivePage("dashboard")
    } else if (pathWithoutLocale === "/plan") {
      // プランページではサイドバーのメニューをアクティブにしない
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
      {/* 設定モーダル */}
      <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />

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

      {/* 設定ボタン */}
      <div className="p-2">
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="flex items-center border-gray-600  gap-3 px-2 py-2 text-gray-400 border hover:text-white rounded-full transition-all duration-200 ease-out active:scale-[0.98]"
        >
          <Settings className="w-7 h-7" />
        </button>
      </div>

      {/* フッター - ユーザー情報 */}
      <SidebarFooter className="border-t border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="text-gray-300 hover:text-white hover:bg-gray-800"
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
      </Sidebar>
    </>
  )
}
