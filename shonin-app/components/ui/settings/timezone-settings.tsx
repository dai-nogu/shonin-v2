"use client"

import { Globe } from "lucide-react"
import { useTimezone } from "@/contexts/timezone-context"
import { useSessions } from "@/contexts/sessions-context"
import { TIMEZONES } from "@/lib/timezone-utils"
import { Card, CardContent } from "@/components/ui/common/card"
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
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="space-y-4 px-0 pt-0">
        <div className="space-y-2">
          <Select 
            value={timezone} 
            onValueChange={setTimezone}
            disabled={isSessionActive}
          >
            <SelectTrigger className={`bg-gray-700 border-gray-600 text-white focus:ring-0 focus:ring-offset-0 ${
              isSessionActive ? 'opacity-50 cursor-not-allowed' : ''
            }`}>
              <SelectValue>
                {t(`timezones.${timezone}`) || timezone}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              {TIMEZONES.map((tz) => (
                <SelectItem 
                  key={tz.value} 
                  value={tz.value}
                  className="text-white hover:bg-gray-600 focus:bg-gray-600"
                >
                  {t(`timezones.${tz.value}`) || tz.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 進行中セッションがある場合の警告 */}
        {isSessionActive && (
          <div className="p-4 bg-red-900 border border-red-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div>
                <p className="text-red-300 text-sm mt-1">{t('settings.timezone_disabled_message')}</p>
              </div>
            </div>
          </div>
        )}

        {/* 通常の注意事項 */}
        {!isSessionActive && (
          <div className="mt-4">
            <p className="text-base text-red-400 font-semibold">
              ⚠️ {t('settings.timezone_notice_title')}
            </p>
            <ul className="text-sm text-gray-300 mt-2 space-y-1">
              <li>• {t('settings.timezone_notice_1')}</li>
              <li>• {t('settings.timezone_notice_2')}</li>
              <li>• {t('settings.timezone_notice_3')}</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 