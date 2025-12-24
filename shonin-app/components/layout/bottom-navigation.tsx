"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useParams } from "next/navigation"
import { useTranslations } from 'next-intl'
import { Home, Settings } from "lucide-react"
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

  // next-intlを使用したメニューアイテム（Horizonと設定のみ）
  const menuItems = [
    {
      id: "horizon",
      label: t('navigation.horizon'),
      icon: Home,
      url: `/${locale}/horizon`,
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
    
    if (pathWithoutLocale === "/horizon" || pathWithoutLocale === "/" || pathWithoutLocale === "/session" || pathWithoutLocale === "/goals" || pathWithoutLocale.startsWith("/goals/")) {
      setActivePage("horizon")
    } else if (pathWithoutLocale === "/settings" || pathWithoutLocale.startsWith("/settings/") || pathWithoutLocale === "/plan") {
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

  // アクティブなアイテムのインデックスを取得
  const activeIndex = menuItems.findIndex(item => item.id === activePage)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 safe-area-pb">
      <div className="relative flex justify-around items-center h-20 px-2">
        {/* スライドインジケーター */}
        <div
          className="absolute top-2 h-16 w-16 bg-gray-800/70 rounded-xl transition-all duration-300 ease-out"
          style={{
            left: `calc(${(activeIndex / menuItems.length) * 100}% + ${100 / menuItems.length / 2}% - 32px)`,
            opacity: activeIndex >= 0 ? 1 : 0,
          }}
        />
        
        {menuItems.map((item, index) => {
          const isActive = activePage === item.id
          const Icon = item.icon
          
          return (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id, item.url)}
              className={cn(
                "relative z-10 flex flex-col items-center justify-center h-16 w-16 rounded-xl transition-all duration-300 ease-out active:scale-95",
                isActive 
                  ? "text-emerald-500" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              <Icon className={cn(
                "w-7 h-7 transition-all duration-300 ease-out",
                isActive ? "text-emerald-500 scale-110" : "text-gray-400 scale-100"
              )} />
              {/* アクティブインジケーターのドット */}
              <div className={cn(
                "absolute bottom-1 w-1 h-1 rounded-full bg-emerald-500 transition-all duration-300",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )} />
            </button>
          )
        })}
      </div>
    </nav>
  )
} 