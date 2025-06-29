"use client"

import { useState, useEffect } from "react"
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

const menuItems = [
  {
    title: "ダッシュボード",
    url: "/",
    icon: Home,
    id: "dashboard",
  },
  {
    title: "カレンダー",
    url: "/calendar",
    icon: Calendar,
    id: "calendar",
  },
  {
    title: "目標管理",
    url: "/goals",
    icon: Target,
    id: "goals",
  },
  {
    title: "設定",
    url: "/settings",
    icon: Settings,
    id: "settings",
  },
]

interface AppSidebarProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function AppSidebar({ currentPage = "dashboard", onPageChange }: AppSidebarProps) {
  const [activePage, setActivePage] = useState(currentPage)

  useEffect(() => {
    setActivePage(currentPage)
  }, [currentPage])

  const handlePageChange = (pageId: string) => {
    setActivePage(pageId)
    onPageChange?.(pageId)
  }

  return (
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="border-b border-gray-800 p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">SHONIN</h1>
            <p className="text-xs text-gray-400">努力の証人</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400">メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handlePageChange(item.id)}
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
