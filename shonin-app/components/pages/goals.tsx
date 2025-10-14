"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, Target, Calendar, Clock, Edit2, Trash2, Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Progress } from "@/components/ui/common/progress"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useToast } from "@/contexts/toast-context"
import { useTranslations, useLocale } from 'next-intl'
import { formatISODateForLocale } from '@/lib/i18n-utils'

interface Goal {
  id: string
  title: string
  motivation: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  weekdayHours: number
  weekendHours: number
  createdAt: string
  status: "active" | "completed" | "paused"
  // 生の秒値も保持
  targetDurationSeconds?: number
  currentValueSeconds?: number
}

interface GoalsProps {
  initialGoals?: any[]
}

export function Goals({ initialGoals }: GoalsProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const { showError } = useToast()
  const t = useTranslations()
  const currentLocale = useLocale()
  
  // データベースフック（初期データがある場合は初期化）
  const { 
    goals: dbGoals, 
    loading, 
    error, 
    deleteGoal: deleteGoalFromDb 
  } = useGoalsDb(initialGoals)

  // ローカルステート
  const [goals, setGoals] = useState<Goal[]>([])

  // 週間時間の計算
  const calculateWeeklyHours = (weekdayHours: number, weekendHours: number) => {
    return (weekdayHours * 5) + (weekendHours * 2)
  }

  // 秒を時間.分の小数形式に変換する関数
  const formatSecondsToDecimalHours = (seconds: number): number => {
    return Math.round((seconds / 3600) * 100) / 100 // 小数点2桁で四捨五入
  }

  // 秒を時間:分の文字列形式に変換する関数
  const formatSecondsToTimeString = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // データベースからの目標を変換
  useEffect(() => {
    if (dbGoals) {
      const convertedGoals: Goal[] = dbGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        motivation: goal.description || '',
        targetValue: formatSecondsToDecimalHours(goal.target_duration || 0), // 秒から小数時間に変換
        currentValue: formatSecondsToDecimalHours(goal.current_value || 0), // 秒から小数時間に変換
        unit: goal.unit || '時間',
        deadline: goal.deadline || '',
        weekdayHours: goal.weekday_hours || 0,
        weekendHours: goal.weekend_hours || 0,
        createdAt: goal.created_at.split('T')[0],
        status: (goal.status as "active" | "completed" | "paused") || 'active',
        // 生の秒値も保持
        targetDurationSeconds: goal.target_duration || 0,
        currentValueSeconds: goal.current_value || 0
      }))
      setGoals(convertedGoals)
    }
  }, [dbGoals])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getRemainingDays = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAddGoal = () => {
    router.push(`/${locale}/goals/add`)
  }

  const handleEditGoal = (goalId: string) => {
    router.push(`/${locale}/goals/edit/${goalId}`)
  }

  const handleDeleteGoal = async (goalId: string) => {
    const confirmed = confirm(t('goals.delete_confirmation'))
    if (confirmed) {
      const success = await deleteGoalFromDb(goalId)
      if (!success) {
        showError(t('goals.delete_error'))
      }
    }
  }

  // エラー状態
  if (error) {
    return (
      <div className="text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">エラーが発生しました: {error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
              {t('goals.reload')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-white">
      <div className="container mx-auto max-w-4xl">
        {/* 目標追加ボタン - モバイル用右下固定 */}
        {goals.length > 0 && (
          <div className="fixed bottom-24 right-6 z-[60] md:hidden">
            <Button
              onClick={handleAddGoal}
              className="bg-green-500 hover:bg-green-600 shadow-lg w-11 h-11 rounded-full p-0"
            >
              <Plus className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* 目標一覧 */}
        <div className="space-y-6">
          {goals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal.currentValue, goal.targetValue)
            const remainingDays = getRemainingDays(goal.deadline)
            const isOverdue = remainingDays < 0
            const isUrgent = remainingDays <= 7 && remainingDays >= 0
            const weeklyHours = calculateWeeklyHours(goal.weekdayHours, goal.weekendHours)

            return (
              <Card key={goal.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="px-2 md:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl mb-3">{goal.title}</CardTitle>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGoal(goal.id)}
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-2 md:px-6">
                  {/* 動機表示 */}
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-white">{goal.motivation}</p>
                  </div>
                  
                  {/* 進捗表示 */}
                  <div className="space-y-2 mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{t('goals.progress_status')}</span>
                      <span className="text-sm font-medium text-white">
                        {goal.currentValueSeconds ? formatSecondsToTimeString(goal.currentValueSeconds) : `${goal.currentValue}h`} / {goal.targetDurationSeconds ? formatSecondsToTimeString(goal.targetDurationSeconds) : `${goal.targetValue}h`} ({Math.round(progressPercentage)}%)
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* 期限と残り日数 */}
                  <div className="flex items-center justify-between text-sm mt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">{t('goals.deadline_label')}: {formatISODateForLocale(goal.deadline, currentLocale)}</span>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      <span>
                        {isOverdue 
                          ? t('goals.days_overdue', { days: Math.abs(remainingDays) })
                          : t('goals.days_remaining', { days: remainingDays })
                        }
                      </span>
                    </div>
                  </div>

                  {/* 取り組み時間の詳細 */}
                  <div className="bg-gray-800 py-3 px-2 md:px-3 rounded-lg mt-3">
                    <div className="grid grid-cols-3 gap-2 md:gap-4 text-sm">
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400">{t('goals.weekday')}: </span>
                        <span className="text-white">{goal.weekdayHours}{t('goals.hours_unit')}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400">{t('goals.weekend')}: </span>
                        <span className="text-white">{goal.weekendHours}{t('goals.hours_unit')}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className="text-gray-400">{t('goals.weekly')}: </span>
                        <span className="text-white">{weeklyHours}{t('goals.hours_unit')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 目標追加ボタン - PC用（目標一覧の下に配置） */}
        {goals.length > 0 && (
          <div className="mt-8 text-center hidden md:block">
            <Button
              onClick={handleAddGoal}
              className="bg-green-500 hover:bg-green-600 px-8 py-3"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('goals.add_goal')}
            </Button>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">{t('goals.set_goal_message')}</h3>
            <Button
              onClick={handleAddGoal}
              className="bg-green-500 hover:bg-green-600 px-8 md:px-12 py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('goals.set_goal')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// 目標管理の公開関数（アクティビティから使用）
export const getActiveGoals = (): Goal[] => {
  // ここは実際の実装では状態管理ライブラリやAPIから取得
  return []
} 