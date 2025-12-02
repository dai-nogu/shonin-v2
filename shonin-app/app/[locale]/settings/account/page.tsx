import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { AccountManagement } from "@/components/ui/settings/account-management"
import { getTranslations } from "next-intl/server"

export default async function AccountPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ヘッダー */}
      <header>
        <div className="container mx-auto px-4 py-4">
          <Link href={`/${locale}/settings`} className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-6 h-6 text-gray-300" />
            <h1 className="text-xl font-bold text-white">
              {t("settings.categories.account")}
            </h1>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AccountManagement />
      </main>
    </div>
  )
}

