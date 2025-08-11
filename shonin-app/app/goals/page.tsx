"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Goals } from "@/components/goals"
import { BottomNavigation } from "@/components/bottom-navigation"

export default function GoalsPage() {
  const router = useRouter()

  const [isGoalEditing, setIsGoalEditing] = useState(false)
  const [isGoalAdding, setIsGoalAdding] = useState(false)

  const handleBack = () => {
    router.push("/dashboard")
  }



  return (
    <>
      {/* 目標編集中・追加中はサイドバーを非表示 */}
      {!(isGoalEditing || isGoalAdding) && (
        <AppSidebar currentPage="goals" />
      )}
      <SidebarInset>
        <div className={`md:min-h-screen bg-gray-950 text-white md:pb-0 ${
          isGoalEditing || isGoalAdding ? "pb-0" : "pb-20"
        }`}>
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Goals 
              onBack={handleBack} 
              onEditingChange={setIsGoalEditing}
              onAddingChange={setIsGoalAdding}
            />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション - 目標編集中・追加中は非表示 */}
      {!(isGoalEditing || isGoalAdding) && (
        <BottomNavigation currentPage="goals" />
      )}
    </>
  )
} 