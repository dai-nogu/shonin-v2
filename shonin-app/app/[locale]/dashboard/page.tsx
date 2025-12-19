import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { DashboardContent } from "@/components/ui/dashboard/dashboard-content"
import { getGoals } from "@/app/actions/goals"

export default async function DashboardPage() {
  // サーバーサイドで目標データを取得
  const goalsResult = await getGoals()
  const initialGoals = goalsResult.success ? goalsResult.data : []

  return (
    <>
      <AppSidebar currentPage="dashboard" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          {/* Header - SPでのみ表示 */}
          <div className="md:hidden">
            <Header currentPage="dashboard" />
          </div>
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <DashboardContent initialGoals={initialGoals} />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="dashboard" />
    </>
  )
}
