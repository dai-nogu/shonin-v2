"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { Home, Calendar, BarChart3, Target, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AppSidebarProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function AppSidebar({ currentPage = "dashboard", onPageChange }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const [activePage, setActivePage] = useState(currentPage)

  // 一時的にハードコードされたメニューアイテム（後でnext-intl再導入時に修正）
  const menuItems = [
    {
      title: locale === 'ja' ? 'ダッシュボード' : 'Dashboard',
      url: `/${locale}/dashboard`,
      icon: Home,
      id: "dashboard",
    },
    {
      title: locale === 'ja' ? 'カレンダー' : 'Calendar',
      url: `/${locale}/calendar/month`,
      icon: Calendar,
      id: "calendar",
    },
    {
      title: locale === 'ja' ? '目標' : 'Goals',
      url: `/${locale}/goals`,
      icon: Target,
      id: "goals",
    },
    {
      title: locale === 'ja' ? '設定' : 'Settings',
      url: `/${locale}/settings`,
      icon: Settings,
      id: "settings",
    },
  ]

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    if (pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/" || pathWithoutLocale === "/session") {
      setActivePage("dashboard")
    } else if (pathWithoutLocale === "/calendar" || pathWithoutLocale.startsWith("/calendar/")) {
      setActivePage("calendar")
    } else if (pathWithoutLocale === "/goals") {
      setActivePage("goals")
    } else if (pathWithoutLocale === "/settings") {
      setActivePage("settings")
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

      <SidebarRail />
    </Sidebar>
  )
}
