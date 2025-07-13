import { MessageCircle, Calendar, TrendingUp, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CompletedSession } from "./time-tracker"

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  // 先週の日付を計算
  const getLastWeekString = () => {
    const today = new Date()
    
    // 今週の日曜日を取得
    const currentSunday = new Date(today)
    currentSunday.setDate(today.getDate() - today.getDay())
    
    // 先週の日曜日を取得
    const lastSunday = new Date(currentSunday)
    lastSunday.setDate(currentSunday.getDate() - 7)
    
    // 先週の土曜日を取得
    const lastSaturday = new Date(lastSunday)
    lastSaturday.setDate(lastSunday.getDate() + 6)
    
    // 日付をフォーマット（月/日形式）
    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
    
    return `${formatDate(lastSunday)} 〜 ${formatDate(lastSaturday)}`
  }

  // 週次フィードバック
  const weeklyFeedback = {
    type: "週次",
    date: getLastWeekString(),
    message: "",
  }

  // 先月の日付を計算
  const getLastMonthString = () => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    const formatDate = (date: Date) => {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
    
    return `${formatDate(lastMonth)} 〜 ${formatDate(lastMonthEnd)}`
  }

  // 来月1日の日付を計算
  const getNextMonthFirstDay = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return `${nextMonth.getMonth() + 1}/${nextMonth.getDate()}`
  }

  // 来週月曜日の日付を計算
  const getNextWeekMonday = () => {
    const today = new Date()
    
    // 今週の月曜日を計算
    const thisWeekMonday = new Date(today)
    const daysSinceMonday = (today.getDay() + 6) % 7 // 月曜日を0とする
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday)
    
    // 来週の月曜日（今週の月曜日 + 7日）
    const nextWeekMonday = new Date(thisWeekMonday)
    nextWeekMonday.setDate(thisWeekMonday.getDate() + 7)
    
    return `${nextWeekMonday.getMonth() + 1}/${nextWeekMonday.getDate()}`
  }

  // 先月フィードバック
  const monthlyFeedback = {
    type: "月次",
    date: getLastMonthString(),
    message: "",
  }

  const feedbacks = [weeklyFeedback, monthlyFeedback]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <CardTitle className="text-white flex items-center text-base lg:text-lg">
          <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-yellow-400" />
          AIフィードバック
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 lg:space-y-6">
        {feedbacks.map((feedback, index) => (
          <div key={feedback.type} className={index > 0 ? "pt-3 lg:pt-4 border-t border-gray-800" : ""}>
            {/* フィードバック種別 */}
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                {feedback.type}フィードバック
              </Badge>
              <span className="text-xs text-gray-400">{feedback.date}</span>
            </div>

            {/* フィードバックメッセージ */}
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feedback.message || "フィードバックを準備中です..."}
                </p>
              </div>
            </div>

            {/* 次回フィードバック予告 */}
            <div className="text-xs text-gray-500 pt-2">
              {feedback.type === "週次" && (
                <div>次回の週次フィードバック: {getNextWeekMonday()}予定</div>
              )}
              {feedback.type === "月次" && (
                <div>次回の月次フィードバック: {getNextMonthFirstDay()}予定</div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 