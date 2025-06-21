import { Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function GoalProgress() {
  const goals = [
    {
      name: "プログラミング習得",
      progress: 65,
      status: "予定通り",
      deadline: "2024年3月末",
      statusColor: "bg-blue-500",
    },
    {
      name: "読書100冊",
      progress: 42,
      status: "順調",
      deadline: "2024年12月末",
      statusColor: "bg-green-500",
    },
    {
      name: "体重5kg減量",
      progress: 80,
      status: "要注意",
      deadline: "2024年2月末",
      statusColor: "bg-red-500",
    },
  ]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Target className="w-5 h-5 mr-2" />
          目標の進捗
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm font-medium">{goal.name}</span>
              <Badge className={`${goal.statusColor} text-white text-xs`}>{goal.status}</Badge>
            </div>
            <Progress value={goal.progress} className="h-2" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-green-400">{goal.progress}% 完了</span>
              <span className="text-gray-400">📅 {goal.deadline}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
