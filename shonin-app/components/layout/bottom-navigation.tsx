"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Calendar, Target, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  currentPage?: string
  onPageChange?: (pageId: string) => void
}

export function BottomNavigation({ currentPage, onPageChange }: BottomNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const [isMobile, setIsMobile] = useState(false)
  const [activePage, setActivePage] = useState(currentPage)
  const t = useTranslations()

  // next-intlを使用したメニューアイテム
  const menuItems = [
    {
      id: "dashboard",
      label: t('navigation.dashboard'),
      icon: Home,
      url: `/${locale}/dashboard`,
    },
    {
      id: "calendar", 
      label: t('navigation.calendar'),
      icon: Calendar,
      url: `/${locale}/calendar/month`,
    },
    {
      id: "goals",
      label: t('navigation.goals'),
      icon: Target,
      url: `/${locale}/goals`,
    },
    {
      id: "settings",
      label: t('navigation.settings'),
      icon: Settings,
      url: `/${locale}/settings`,
    },
  ]

  // パスに基づいてアクティブページを設定（pathnameを優先）
  useEffect(() => {
    if (!pathname) return
    
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
                "flex flex-col items-center justify-center h-16 w-16 rounded-xl transition-all duration-200",
                isActive 
                  ? "text-green-500 bg-gray-800/50" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800/30"
              )}
            >
              <Icon className={cn(
                "w-7 h-7 transition-all duration-200",
                isActive ? "text-green-500" : "text-gray-400"
              )} />
            </button>
          )
        })}
      </div>
    </nav>
  )
} 