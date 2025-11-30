"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function ConditionalSidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // pathnameがnullの場合は早期リターン
  if (!pathname) {
    return <>{children}</>
  }
  
  // ロケールを除いたパスを取得
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/'
  
  const isLoginPage = pathWithoutLocale === '/login'
  const isGoalAddPage = pathWithoutLocale === '/goals/add'
  const isGoalEditPage = pathWithoutLocale.startsWith('/goals/edit/')
  const isSettingsPage = pathWithoutLocale.startsWith('/settings')

  if (isLoginPage || isGoalAddPage || isGoalEditPage || isSettingsPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
} 