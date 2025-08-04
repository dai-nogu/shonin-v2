"use client"

import { useState, useEffect } from "react"
import { Menu, Home, Calendar, Target, Settings, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  currentPage: string
  onPageChange: (pageId: string) => void
}

const menuItems = [
  {
    id: "dashboard",
    label: "トップ",
    icon: Home,
  },
  {
    id: "calendar",
    label: "カレンダー",
    icon: Calendar,
  },
  {
    id: "goals",
    label: "目標設定",
    icon: Target,
  },
  {
    id: "settings",
    label: "設定",
    icon: Settings,
  },
]

export function MobileMenu({ currentPage, onPageChange }: MobileMenuProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // モバイルでない場合は非表示
  if (!isMobile) {
    return null
  }

  const handlePageChange = (pageId: string) => {
    onPageChange(pageId)
    setOpen(false) // メニューを閉じる
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-800 h-12 w-12 relative"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span 
              className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                open ? 'rotate-45 translate-y-0' : '-translate-y-0.5'
              }`}
            />
            <span 
              className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span 
              className={`bg-white block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${
                open ? '-rotate-45 translate-y-0' : 'translate-y-0.5'
              }`}
            />
          </div>
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-gray-900 border-gray-800 [&>button]:!hidden">
        <VisuallyHidden>
          <SheetTitle>ナビゲーションメニュー</SheetTitle>
        </VisuallyHidden>
        
        {/* メニュー内の×ボタン（ハンバーガーボタンと同じアニメーション） */}
        <div className="absolute right-4 top-4 z-50">
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800 h-12 w-12 relative"
            >
                             <div className="w-6 h-6 flex items-center justify-center relative">
                 <span className="bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm rotate-45 absolute" />
                 <span className="bg-white block transition-all duration-300 ease-out h-0.5 w-5 rounded-sm -rotate-45 absolute" />
               </div>
              <span className="sr-only">メニューを閉じる</span>
            </Button>
          </SheetClose>
        </div>
        
        <nav className="mt-12">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const isActive = currentPage === item.id
              const Icon = item.icon
              
              return (
                <li key={item.id}>
                  <Button
                    onClick={() => handlePageChange(item.id)}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 text-left transition-all duration-200",
                      isActive 
                        ? "bg-green-600 text-white hover:bg-green-700" 
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="text-base">{item.label}</span>
                  </Button>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
} 