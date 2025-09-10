import { MessageCircle, Calendar, TrendingUp, Sparkles, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useState, useEffect } from "react"
import { useAIFeedback } from "@/hooks/use-ai-feedback"
import type { CompletedSession } from "./time-tracker"

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

interface FeedbackData {
  type: string
  date: string
  message: string
}

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([
    { type: "週次", date: "", message: "セッションを記録すると、週次フィードバックが受け取れます。まずは何か活動を記録してみましょう！" },
    { type: "月次", date: "", message: "継続的な記録により、月次フィードバックが受け取れます。日々の積み重ねが大切です。" }
  ])
  
  const { 
    isLoading, 
    error, 
    getWeeklyFeedback, 
    getMonthlyFeedback,
    generateWeeklyFeedback, 
    generateMonthlyFeedback,
    getLastWeekRange,
    getLastMonthRange
  } = useAIFeedback()

  // 日付をフォーマット（月/日形式）
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 日付範囲を文字列に変換
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${formatDate(startDate)} 〜 ${formatDate(endDate)}`
  }

  // 来週月曜日の日付を計算
  const getNextWeekMonday = () => {
    const today = new Date()
    const thisWeekMonday = new Date(today)
    const daysSinceMonday = (today.getDay() + 6) % 7
    thisWeekMonday.setDate(today.getDate() - daysSinceMonday)
    const nextWeekMonday = new Date(thisWeekMonday)
    nextWeekMonday.setDate(thisWeekMonday.getDate() + 7)
    return `${nextWeekMonday.getMonth() + 1}/${nextWeekMonday.getDate()}`
  }

  // 来月1日の日付を計算
  const getNextMonthFirstDay = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    return `${nextMonth.getMonth() + 1}/${nextMonth.getDate()}`
  }

  // フィードバックを読み込む
  const loadFeedbacks = async () => {
    try {
      const weekRange = getLastWeekRange()
      const monthRange = getLastMonthRange()

      const [weeklyResult, monthlyResult] = await Promise.all([
        getWeeklyFeedback(),
        getMonthlyFeedback()
      ])

      const newFeedbacks = []

      // 週次フィードバック
      if (weeklyResult?.feedback) {
        newFeedbacks.push({
          type: "週次",
          date: formatDateRange(weeklyResult.period_start, weeklyResult.period_end),
          message: weeklyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: "週次", 
          date: "", 
          message: "まだ十分なデータが蓄積されていません。セッションを記録すると、週次フィードバックが受け取れるようになります。"
        })
      }

      // 月次フィードバック
      if (monthlyResult?.feedback) {
        newFeedbacks.push({
          type: "月次",
          date: formatDateRange(monthlyResult.period_start, monthlyResult.period_end),
          message: monthlyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: "月次", 
          date: "", 
          message: "継続的な記録により、月次フィードバックが受け取れます。日々の積み重ねを続けましょう。"
        })
      }

      setFeedbacks(newFeedbacks)
    } catch (err) {
      console.error('フィードバック読み込みエラー:', err)
      setFeedbacks([
        { type: "週次", date: "", message: "まだ十分なデータが蓄積されていません。セッションを記録すると、週次フィードバックが受け取れるようになります。" },
        { type: "月次", date: "", message: "継続的な記録により、月次フィードバックが受け取れます。日々の積み重ねを続けましょう。" }
      ])
    }
  }

  // コンポーネントマウント時にフィードバックを読み込む
  useEffect(() => {
    loadFeedbacks()
  }, [])

  // 自動ループ機能
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % feedbacks.length)
        setIsTransitioning(false)
      }, 1000) // フェードアウト時間
    }, 20000) // 20秒ごとに切り替え

    return () => clearInterval(interval)
  }, [feedbacks.length])

  const handleTransition = (newIndex: number) => {
    if (newIndex === currentIndex) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(newIndex)
      setIsTransitioning(false)
    }, 1000) // フェードアウト時間
  }

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + feedbacks.length) % feedbacks.length
    handleTransition(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % feedbacks.length
    handleTransition(newIndex)
  }

  const handleRefresh = async () => {
    try {
      const weekRange = getLastWeekRange()
      const monthRange = getLastMonthRange()

      // 強制的に新しいフィードバックを生成
      const [weeklyResult, monthlyResult] = await Promise.all([
        generateWeeklyFeedback(),
        generateMonthlyFeedback()
      ])

      const newFeedbacks = []

      // 週次フィードバック
      if (weeklyResult?.feedback) {
        newFeedbacks.push({
          type: "週次",
          date: formatDateRange(weeklyResult.period_start, weeklyResult.period_end),
          message: weeklyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: "週次", 
          date: "", 
          message: "まだ十分なデータが蓄積されていません。セッションを記録すると、週次フィードバックが受け取れるようになります。"
        })
      }

      // 月次フィードバック
      if (monthlyResult?.feedback) {
        newFeedbacks.push({
          type: "月次",
          date: formatDateRange(monthlyResult.period_start, monthlyResult.period_end),
          message: monthlyResult.feedback
        })
      } else {
        newFeedbacks.push({
          type: "月次", 
          date: "", 
          message: "継続的な記録により、月次フィードバックが受け取れます。日々の積み重ねを続けましょう。"
        })
      }

      setFeedbacks(newFeedbacks)
    } catch (err) {
      console.error('フィードバック更新エラー:', err)
      // エラー時は既存のフィードバックを再読み込み
      loadFeedbacks()
    }
  }

  const currentFeedback = feedbacks[currentIndex]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center text-[1.25rem] md:text-2xl">
            <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
            {currentFeedback.type}フィードバック
          </CardTitle>
          
          {/* コントロール */}
          <div className="flex items-center space-x-2">
            {/* 更新ボタン */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {/* インジケーター */}
            <div className="flex space-x-1">
              {feedbacks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTransition(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                  aria-label={`${index === 0 ? '週次' : '月次'}フィードバックに切り替え`}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          {/* 日付表示 */}
          {currentFeedback.date && (
            <div className="flex justify-end mb-2 lg:mb-3">
              <span className="text-xs text-gray-400">{currentFeedback.date}</span>
            </div>
          )}

          {/* フィードバックメッセージ */}
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="flex items-start space-x-2">
              <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm leading-relaxed">
                {isLoading ? (
                  <span className="flex items-center">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    フィードバックを生成中...
                  </span>
                ) : error ? (
                  <span className="text-red-400">エラー: {error}</span>
                ) : (
                  currentFeedback.message
                )}
              </p>
            </div>
          </div>

          {/* 次回フィードバック予告 */}
          <div className="text-xs text-gray-500">
            {currentFeedback.type === "週次" && (
              <div>次回の週次フィードバック: {getNextWeekMonday()}予定</div>
            )}
            {currentFeedback.type === "月次" && (
              <div>次回の月次フィードバック: {getNextMonthFirstDay()}予定</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 