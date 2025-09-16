import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { DashboardMainContent } from "@/components/ui/dashboard/dashboard-main-content"
import { DashboardSidebarContent } from "@/components/ui/dashboard/dashboard-sidebar-content"

export default async function DashboardPage() {
  // SSRとして初期データを設定（認証は後でクライアントサイドで処理）
  const completedSessions: any[] = []
  const user: any = { id: 'temp-user' }

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* メインエリア - 2列分 */}
              <div className="lg:col-span-2">
                <DashboardMainContent 
                  initialCompletedSessions={completedSessions}
                  user={user}
                />
              </div>

              {/* サイドバー - 1列分 */}
              <div className="space-y-4 lg:space-y-6">
                <DashboardSidebarContent 
                  initialCompletedSessions={completedSessions}
                  user={user}
                />
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="dashboard" />
    </>
  )
} 