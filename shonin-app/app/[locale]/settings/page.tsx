import { ChevronRight, User, Globe, Languages, Activity, KeyRound } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  const settingsCategories = [
    {
      id: "profile",
      title: t("settings.categories.profile"),
      href: `/${locale}/settings/profile`,
      icon: User
    },
    {
      id: "timezone",
      title: t("settings.categories.timezone"),
      href: `/${locale}/settings/timezone`,
      icon: Globe
    },
    {
      id: "language",
      title: t("settings.categories.language"),
      href: `/${locale}/settings/language`,
      icon: Languages
    },
    {
      id: "activity",
      title: t("settings.categories.activity"),
      href: `/${locale}/settings/activity`,
      icon: Activity
    },
    {
      id: "account",
      title: t("settings.categories.account"),
      href: `/${locale}/settings/account`,
      icon: KeyRound
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* ヘッダー */}
      <header>
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href={`/${locale}/dashboard`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-white">SHONIN</span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {t("settings.title")}
          </h1>
          <p className="text-gray-300">
            {t("settings.description")}
          </p>
        </div>

        {/* 設定カテゴリカード */}
        <div className="space-y-4">
          {settingsCategories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={category.href}
                className="block bg-gray-800 rounded-xl border border-gray-700 hover:border-green-500 hover:shadow-md transition-all duration-200"
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-white">
                      {category.title}
                    </h2>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
