"use client"

import { BarChart3, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface WeeklyProgressProps {
  onWeekViewClick?: () => void
}

export function WeeklyProgress({ onWeekViewClick }: WeeklyProgressProps) {
  const weekData = [
    { day: "月", hours: 3.5, progress: 87 },
    { day: "火", hours: 2.8, progress: 70 },
    { day: "水", hours: 4.2, progress: 100 },
    { day: "木", hours: 3.1, progress: 77 },
    { day: "金", hours: 2.5, progress: 62 },
    { day: "土", hours: 1.8, progress: 45 },
    { day: "日", hours: 2.7, progress: 67 },
  ]

  const totalHours = weekData.reduce((sum, day) => sum + day.hours, 0)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            今週の進捗
          </CardTitle>
          <Button
            onClick={onWeekViewClick}
            variant="ghost"
            size="sm"
            className="text-green-400 hover:text-green-300 hover:bg-gray-800"
          >
            <Calendar className="w-4 h-4 mr-1" />
            週表示
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {weekData.map((day) => (
          <div key={day.day} className="flex items-center space-x-3">
            <span className="text-gray-300 w-4">{day.day}</span>
            <Progress value={day.progress} className="flex-1 h-2" />
            <span className="text-gray-400 text-sm w-12 text-right">{day.hours}h</span>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{totalHours.toFixed(1)}h</div>
            <div className="text-sm text-gray-400">今週の合計</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
