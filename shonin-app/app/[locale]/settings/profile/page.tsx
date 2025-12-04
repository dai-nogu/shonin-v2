import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { ProfileSettings } from "@/components/ui/settings/profile-settings"
import { getSubscriptionInfo } from "@/app/actions/subscription-info"
import { getProfile } from "@/app/actions/user-profile"
import { getTranslations } from "next-intl/server"

export default async function ProfilePage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const [subscriptionInfo, userProfile] = await Promise.all([
    getSubscriptionInfo(),
    getProfile()
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ヘッダー */}
      <header>
        <div className="container mx-auto px-4 py-4">
          <Link href={`/${locale}/settings`} className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-6 h-6 text-gray-300" />
            <h1 className="text-xl font-bold text-white">
              {t("settings.categories.profile")}
            </h1>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 md:pt-0 max-w-2xl">
        <ProfileSettings 
          initialSubscriptionInfo={subscriptionInfo}
          initialUserProfile={userProfile}
        />
      </main>
    </div>
  )
}

