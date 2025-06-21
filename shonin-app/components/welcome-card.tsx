import { Clock, Target, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function WelcomeCard() {
  return (
    <Card className="bg-green-500 border-0 text-white">
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-1">おかえりなさい</h2>
          <p className="text-green-100 opacity-90">今日も努力を積み重ねましょう - 17:35</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">2h 45m</div>
            <div className="text-sm text-green-100">今日の記録</div>
          </div>

          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">7</div>
            <div className="text-sm text-green-100">連続記録日</div>
          </div>

          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">+15%</div>
            <div className="text-sm text-green-100">先週比</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
