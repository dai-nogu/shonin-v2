import { MessageCircle, Calendar, TrendingUp, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import type { CompletedSession } from "./time-tracker"

interface AIFeedbackProps {
  completedSessions: CompletedSession[]
}

export function AIFeedback({ completedSessions }: AIFeedbackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
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

  const currentFeedback = feedbacks[currentIndex]

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
              {currentFeedback.type}フィードバック
            </CardTitle>
          
          {/* スライダーコントロール */}
          <div className="flex items-center space-x-2">
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
          <div className="flex justify-end mb-2 lg:mb-3">
            <span className="text-xs text-gray-400">{currentFeedback.date}</span>
          </div>

          {/* フィードバックメッセージ */}
          <div className="bg-gray-800 rounded-lg p-3 mb-3">
            <div className="flex items-start space-x-2">
              <MessageCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-gray-300 text-sm leading-relaxed">
                {currentFeedback.message || "フィードバックを準備中です..."}
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