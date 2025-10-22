"use client"

import { useRouter, usePathname, useParams } from "next/navigation"
import { Globe } from "lucide-react"
import { useSessions } from "@/contexts/sessions-context"
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
  const { isSessionActive } = useSessions()
  const t = useTranslations()

  const handleLocaleChange = (newLocale: string) => {
    if (!pathname || isSessionActive) return
    // 言語変更後はダッシュボードに遷移
    const newPath = `/${newLocale}/dashboard`
    router.push(newPath)
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">
          {t('settings.language_settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select 
            value={currentLocale} 
            onValueChange={handleLocaleChange}
            disabled={isSessionActive}
          >
            <SelectTrigger className={`bg-white border-gray-300 text-gray-900 focus:ring-0 focus:ring-offset-0 ${
              isSessionActive ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              <SelectValue>
                {t(`languages.${currentLocale}`) || currentLocale}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {SUPPORTED_LOCALES.map((locale) => (
                <SelectItem 
                  key={locale.code} 
                  value={locale.code}
                  className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100"
                >
                  {t(`languages.${locale.key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 進行中セッションがある場合の警告 */}
        {isSessionActive && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div>
                <p className="text-red-700 text-sm mt-1">{t('settings.language_disabled_message')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 通常の注意事項 */}
        {!isSessionActive && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">
              {t('settings.language_change_notice')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 