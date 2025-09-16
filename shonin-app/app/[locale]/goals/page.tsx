"use client"

import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Goals } from "@/components/pages/goals"
import { BottomNavigation } from "@/components/layout/bottom-navigation"

export default function GoalsPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push("/dashboard")
  }

  return (
    <>
      <AppSidebar currentPage="goals" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Goals onBack={handleBack} />
          </main>
        </div>
      </SidebarInset>
      <BottomNavigation currentPage="goals" />
    </>
  )
} 