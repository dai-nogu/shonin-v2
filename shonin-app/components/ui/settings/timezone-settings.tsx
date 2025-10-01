"use client"

import { Globe } from "lucide-react"
import { useTimezone } from "@/contexts/timezone-context"
import { useSessions } from "@/contexts/sessions-context"
import { TIMEZONES } from "@/lib/timezone-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Label } from "@/components/ui/common/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { useTranslations } from 'next-intl'

export function TimezoneSettings() {
  const { 
    timezone, 
    setTimezone 
  } = useTimezone()
  const { isSessionActive } = useSessions()
  const t = useTranslations()

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">{t('settings.timezone_settings')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">{t('settings.timezone')}</Label>
          <Select 
            value={timezone} 
            onValueChange={setTimezone}
            disabled={isSessionActive}
          >
            <SelectTrigger className={`bg-gray-800 border-gray-700 text-white ${
              isSessionActive ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              <SelectValue>
                {t(`timezones.${timezone}`) || timezone}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {TIMEZONES.map((tz) => (
                <SelectItem 
                  key={tz.value} 
                  value={tz.value}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {t(`timezones.${tz.value}`) || tz.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 進行中セッションがある場合の警告 */}
        {isSessionActive && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div>
                <p className="text-red-200 text-sm mt-1">{t('settings.timezone_disabled_message')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 通常の注意事項 */}
        {!isSessionActive && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div>
                <p className="text-blue-300 font-medium text-sm">{t('settings.timezone_notice_title')}</p>
                <ul className="text-blue-200 text-sm mt-1 space-y-1">
                  <li>• {t('settings.timezone_notice_1')}</li>
                  <li>• {t('settings.timezone_notice_2')}</li>
                  <li>• {t('settings.timezone_notice_3')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 