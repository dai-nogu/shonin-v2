"use client"

import { Globe } from "lucide-react"
import { useTimezone } from "@/contexts/timezone-context"
import { TIMEZONES } from "@/lib/timezone-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TimezoneSettings() {
  const { 
    timezone, 
    setTimezone, 
    getTimezoneDisplayName 
  } = useTimezone()

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">タイムゾーン設定</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">タイムゾーン</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue>
                {getTimezoneDisplayName(timezone)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {TIMEZONES.map((tz) => (
                <SelectItem 
                  key={tz.value} 
                  value={tz.value}
                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                >
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 注意事項 */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
            </div>
            <div>
              <p className="text-blue-300 font-medium text-sm">タイムゾーン設定について</p>
              <ul className="text-blue-200 text-sm mt-1 space-y-1">
                <li>• 時間記録、統計、連続日数の計算に影響します</li>
                <li>• 変更は即座に反映されます</li>
                <li>• 過去のデータも新しいタイムゾーンで表示されます</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 