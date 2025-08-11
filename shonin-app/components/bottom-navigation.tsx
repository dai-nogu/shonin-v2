"use client"

import { Home, Calendar, Target, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface BottomNavigationProps {
  currentPage: string
  onPageChange?: (pageId: string) => void
}

const menuItems = [
  {
    id: "dashboard",
    label: "ホーム",
    icon: Home,
    url: "/dashboard",
  },
  {
    id: "calendar", 
    label: "カレンダー",
    icon: Calendar,
    url: "/calendar",
  },
  {
    id: "goals",
    label: "目標",
    icon: Target,
    url: "/goals",
  },
  {
    id: "settings",
    label: "設定",
    icon: Settings,
    url: "/settings",
  },
]

export function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [activePage, setActivePage] = useState(currentPage)

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (pathname === "/dashboard" || pathname === "/" || pathname === "/session") {
      setActivePage("dashboard")
    } else if (pathname === "/calendar") {
      setActivePage("calendar")
    } else if (pathname === "/goals") {
      setActivePage("goals")
    } else if (pathname === "/settings") {
      setActivePage("settings")
    } else {
      // パスが一致しない場合のみcurrentPageを使用
      setActivePage(currentPage)
    }
  }, [pathname, currentPage])

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePageChange = (pageId: string, url: string) => {
    setActivePage(pageId)
    router.push(url)
    onPageChange?.(pageId)
  }

  // モバイルでない場合は非表示
  if (!isMobile) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 safe-area-pb">
      <div className="flex justify-around items-center h-20 px-2">
        {menuItems.map((item) => {
          const isActive = activePage === item.id
          const Icon = item.icon
          
          return (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id, item.url)}
              className={cn(
                "flex flex-col items-center justify-center h-16 w-24 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-green-500 bg-gray-800/50" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800/30"
              )}
            >
              <Icon className={cn(
                "w-7 h-7 mb-1 transition-all duration-200",
                isActive ? "text-green-500" : "text-gray-400"
              )} />
              <span className={cn(
                "text-sm font-medium transition-all duration-200",
                isActive ? "text-green-500" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
} 