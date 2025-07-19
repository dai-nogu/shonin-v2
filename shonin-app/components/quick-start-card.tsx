import { Book, Dumbbell, Code, Music } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickStartCard() {
  const activities = [
    { name: "読書", icon: Book, lastTime: "1h 30m", color: "bg-blue-500" },
    { name: "運動", icon: Dumbbell, lastTime: "45m", color: "bg-red-500" },
    { name: "プログラミング", icon: Code, lastTime: "2h 15m", color: "bg-purple-500" },
    { name: "音楽練習", icon: Music, lastTime: "1h", color: "bg-yellow-500" },
  ]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <span className="mr-2">▷</span>
          開始する
        </CardTitle>
        <p className="text-gray-400 text-sm">よく使うアクティビティから選択</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {activities.map((activity) => (
            <Button
              key={activity.name}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
            >
              <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center mb-2`}>
                <activity.icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm font-medium">{activity.name}</div>
              <div className="text-xs text-gray-400">前回: {activity.lastTime}</div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
