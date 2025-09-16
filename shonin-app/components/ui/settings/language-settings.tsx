"use client"

import { useRouter, usePathname, useParams } from "next/navigation"
import { Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Label } from "@/components/ui/common/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { SUPPORTED_LOCALES, getLocaleDisplayName } from "@/lib/i18n-utils"

export function LanguageSettings() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const currentLocale = params.locale as string

  const handleLocaleChange = (newLocale: string) => {
    // 現在のパスからロケール部分を新しいロケールに置き換え
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {currentLocale === 'ja' ? '言語' : 'Language'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">表示言語 / Display Language</Label>
          <Select value={currentLocale} onValueChange={handleLocaleChange}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue>
                {getLocaleDisplayName(currentLocale)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {SUPPORTED_LOCALES.map((locale) => (
                <SelectItem 
                  key={locale.code} 
                  value={locale.code}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {locale.flag} {locale.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 注意事項 */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400">
            {currentLocale === 'ja' 
              ? '言語を変更すると、アプリケーション全体の表示言語が切り替わります。'
              : 'Changing the language will switch the display language for the entire application.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 