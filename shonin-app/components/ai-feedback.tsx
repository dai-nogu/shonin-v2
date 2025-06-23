import { MessageCircle, Calendar, TrendingUp, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { CompletedSession } from "./time-tracker"

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  // 週次フィードバック（仮データ）
  const weeklyFeedback = {
    type: "週次",
    date: "2024年1月第2週",
    message: "今週は合計15時間の学習を達成しました！特にプログラミングの集中力が向上しています。来週は復習時間を増やすことをお勧めします。",
    score: 85,
    achievements: ["集中力向上", "継続達成"]
  }

  // 月次フィードバック（仮データ）
  const monthlyFeedback = {
    type: "月次",
    date: "2024年1月",
    message: "1月は目標の80%を達成！学習習慣が定着してきています。来月は新しい分野にチャレンジしてみましょう。",
    score: 80,
    achievements: ["習慣定着", "目標達成"]
  }

  const currentFeedback = weeklyFeedback // 週次と月次を切り替える実装は後で追加

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
          AIフィードバック
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* フィードバック種別 */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-blue-600 text-white">
            <Calendar className="w-3 h-3 mr-1" />
            {currentFeedback.type}フィードバック
          </Badge>
          <span className="text-xs text-gray-400">{currentFeedback.date}</span>
        </div>

        {/* スコア表示 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400 font-bold text-lg">{currentFeedback.score}点</span>
          </div>
          <div className="text-sm text-gray-400">/ 100点</div>
        </div>

        {/* フィードバックメッセージ */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-300 text-sm leading-relaxed">
              {currentFeedback.message}
            </p>
          </div>
        </div>

        {/* 達成項目 */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">今週の成果</h4>
          <div className="flex flex-wrap gap-1">
            {currentFeedback.achievements.map((achievement, index) => (
              <Badge key={index} variant="outline" className="text-xs border-green-600 text-green-400">
                {achievement}
              </Badge>
            ))}
          </div>
        </div>

        {/* 次回フィードバック予告 */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
          次回の月次フィードバック: 2月1日予定
        </div>
      </CardContent>
    </Card>
  )
} 