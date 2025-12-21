import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Goals } from "@/components/pages/goals"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { getGoals } from "@/app/actions/goals"

export default async function GoalsPage() {
  // サーバーサイドで事前にデータを取得
  const result = await getGoals()
  const initialGoals = result.success ? result.data : []

  return (
    <>
      <AppSidebar currentPage="goals" />
      <SidebarInset>
        <div className="md:min-h-screen bg-transparent text-white md:pb-0 pb-20">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Goals initialGoals={initialGoals} />
          </main>
        </div>
      </SidebarInset>
      <BottomNavigation currentPage="goals" />
    </>
  )
} 