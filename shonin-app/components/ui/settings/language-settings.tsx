"use client"

import { useRouter, usePathname, useParams } from "next/navigation"
import { Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Label } from "@/components/ui/common/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { useTranslations } from 'next-intl'

const SUPPORTED_LOCALES = [
  { code: 'ja', key: 'ja' },
  { code: 'en', key: 'en' }
] as const

export function LanguageSettings() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = (params?.locale as string) || 'ja'
  const t = useTranslations()

  const handleLocaleChange = (newLocale: string) => {
    if (!pathname) return
    // 言語変更後はダッシュボードに遷移
    const newPath = `/${newLocale}/dashboard`
    router.push(newPath)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {t('settings.language_settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={currentLocale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue>
                {t(`languages.${currentLocale}`) || currentLocale}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {SUPPORTED_LOCALES.map((locale) => (
                <SelectItem 
                  key={locale.code} 
                  value={locale.code}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {t(`languages.${locale.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 注意事項 */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            {t('settings.language_change_notice')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 