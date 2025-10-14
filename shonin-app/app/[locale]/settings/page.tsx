import { SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Settings } from "@/components/pages/settings"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import { getProfile } from "@/app/actions/user-profile"

export default async function SettingsPage() {
  // サーバーサイドで事前にデータを取得
  const [subscriptionInfo, userProfile] = await Promise.all([
    getSubscriptionInfo(),
    getProfile()
  ])

  return (
    <>
      <AppSidebar currentPage="settings" />
      <SidebarInset>
        <div className="md:min-h-screen bg-gray-950 text-white md:pb-0 pb-20">
          <main className="container mx-auto px-4 py-4 lg:py-8">
            <Settings 
              initialSubscriptionInfo={subscriptionInfo}
              initialUserProfile={userProfile}
            />
          </main>
        </div>
      </SidebarInset>
      {/* モバイル用下部固定ナビゲーション */}
      <BottomNavigation currentPage="settings" />
    </>
  )
} 