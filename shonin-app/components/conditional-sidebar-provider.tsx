"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function ConditionalSidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isGoalEditPage = pathname.startsWith('/goals/edit/')

  if (isLoginPage || isGoalEditPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
} 