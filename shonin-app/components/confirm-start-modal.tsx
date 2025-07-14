"use client"

import { Play, X, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGoalsDb } from "@/hooks/use-goals-db"

interface Activity {
  id: string
  name: string
  duration: string
  date: string
  rating: number
  category: string
  icon: string
  color: string
  goalId?: string
  goalTitle?: string
}

interface ConfirmStartModalProps {
  isOpen: boolean
  activity: Activity | null
  onConfirm: () => void
  onCancel: () => void
  showTags?: boolean
}

export function ConfirmStartModal({ isOpen, activity, onConfirm, onCancel, showTags = true }: ConfirmStartModalProps) {
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = activity?.goalId ? getGoal(activity.goalId) : null
  
  if (!isOpen || !activity) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className="bg-gray-900 border-gray-800 max-w-md w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-white text-center">開始しますか？</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* アクティビティ情報 */}
          <div className={`p-4 rounded-lg ${activity.color} bg-opacity-20 border border-opacity-30`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-12 h-12 ${activity.color} rounded-full flex items-center justify-center text-2xl`}>
                {activity.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{activity.name}</h3>
              </div>
            </div>

            {/* 前回の記録情報 */}
            <div className="bg-opacity-50 rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>前回の記録時間:</span>
                <span className="text-green-400 font-mono">{activity.duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>前回の実施日:</span>
                <span>{activity.date}</span>
              </div>
            </div>

            {/* 目標情報 */}
            {goalInfo && (
              <div className="bg-blue-500 bg-opacity-10 rounded p-3 border border-blue-500 border-opacity-30">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-medium text-sm">関連する目標</span>
                </div>
                <div className="text-white text-sm font-medium">{goalInfo.title}</div>
                {goalInfo.description && (
                  <div className="text-gray-300 text-xs mt-1">{goalInfo.description}</div>
                )}
              </div>
            )}
          </div>

          {/* ボタン */}
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              いいえ
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <Play className="w-4 h-4 mr-2" />
              はい、開始する
            </Button>
          </div>

          {/* 励ましメッセージ */}
          <div className="text-center">
            <p className="text-gray-400 text-sm italic">"継続は力なり - あなたの努力を記録します"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
