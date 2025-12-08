import { ChevronRight, ChevronLeft, User, Languages } from "lucide-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { DeleteAccountButton } from "@/components/ui/settings/delete-account-button"

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
      id: "language",
      title: t("settings.categories.language"),
      href: `/${locale}/settings/language`,
      icon: Languages
    }
  ]

  return (
    <div className="min-h-screen pb-20">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/50 border-b border-white/5">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href={`/${locale}/dashboard`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/20">
              <span className="text-white font-bold text-lg">?</span>
            </div>
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Shonin</span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto py-8 max-w-6xl">
        <Link 
          href={`/${locale}/dashboard`}
          className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-6 group"
        >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Dashboard</span>
        </Link>
      </div>
      <main className="container mx-auto px-4 py-0 md:py-8 max-w-3xl">
        {/* ダッシュボードに戻るリンク */}

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-gray-400">
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
                className="block rounded-xl border border-white/10 bg-card/30 backdrop-blur-xl hover:bg-card/40 hover:border-white/20 transition-all duration-300 group"
              >
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-lg bg-white/5 text-gray-300 group-hover:text-white group-hover:bg-white/10 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {category.title}
                    </h2>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* 退会ボタン */}
        <div className="mt-8 flex justify-end">
          <DeleteAccountButton />
        </div>
      </main>
    </div>
  )
}
