import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { LanguageSettings } from "@/components/ui/settings/language-settings"
import { getTranslations } from "next-intl/server"

export default async function LanguagePage() {
  const t = await getTranslations()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/settings" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
            <h1 className="text-xl font-bold text-gray-900">
              {t("settings.categories.language")}
            </h1>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <LanguageSettings />
      </main>
    </div>
  )
}

