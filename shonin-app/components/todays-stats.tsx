import { Clock, CheckCircle, Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function TodaysStats() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          今日の統計
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">今日の目標</span>
            <span className="text-green-400 font-mono">2h 45m / 4h</span>
          </div>
          <Progress value={68} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-gray-300">完了したタスク</span>
          </div>
          <span className="text-white font-bold">3/5</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Flame className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-gray-300">連続記録</span>
          </div>
          <span className="text-white font-bold">7日</span>
        </div>
      </CardContent>
    </Card>
  )
}
