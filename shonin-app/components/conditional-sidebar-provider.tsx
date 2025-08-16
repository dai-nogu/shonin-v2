"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function ConditionalSidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'
  const isGoalAddPage = pathname === '/goals/add'
  const isGoalEditPage = pathname.startsWith('/goals/edit/')

  if (isLoginPage || isGoalAddPage || isGoalEditPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
} 