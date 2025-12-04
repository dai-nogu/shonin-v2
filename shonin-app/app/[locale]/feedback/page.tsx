import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Header } from "@/components/layout/header"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { FeedbackPageContent } from "@/components/ui/feedback/feedback-page-content"

export default async function FeedbackPage() {
  return (
    <>
      <AppSidebar currentPage="feedback" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          {/* Header - SPでのみ表示 */}
          <div className="md:hidden">
            <Header currentPage="feedback" />
          </div>
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <FeedbackPageContent />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="feedback" />
    </>
  )
}

