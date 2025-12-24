"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ActiveUsersBadge } from "@/components/ui/marketing/active-users-badge"
import { SettingsModal } from "@/components/ui/settings/settings-modal"

interface AppSidebarProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function AppSidebar({ currentPage = "horizon", onPageChange }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [activePage, setActivePage] = useState(currentPage)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const t = useTranslations()

  // next-intlを使用したメニューアイテム（Horizonのみ）
  const menuItems = [
    {
      title: t('navigation.horizon'),
      url: `/${locale}/horizon`,
      icon: Home,
      id: "horizon",
    },
  ]

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (!pathname) return
    
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    if (pathWithoutLocale === "/session") {
      // セッション中はどのメニューもアクティブにしない
      setActivePage("")
    } else if (pathWithoutLocale === "/horizon" || pathWithoutLocale === "/" || pathWithoutLocale === "/goals" || pathWithoutLocale.startsWith("/goals/")) {
      setActivePage("horizon")
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

      <SidebarRail />
      </Sidebar>
    </>
  )
}
