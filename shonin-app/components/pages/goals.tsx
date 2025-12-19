"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, Target, Calendar, Clock, Edit2, Trash2, Calculator, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Progress } from "@/components/ui/common/progress"
import { ErrorModal } from "@/components/ui/common/error-modal"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useToast } from "@/contexts/toast-context"
import { useTranslations, useLocale } from 'next-intl'
import { formatISODateForLocale } from '@/lib/i18n-utils'
import { useSubscriptionContext } from "@/contexts/subscription-context"
import { GoalLimitModal } from "@/components/ui/goals/goal-limit-modal"
import type { Database } from '@/types/database'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/settings/alert-dialog"

// データベースから取得する Goal 型
type DbGoal = Database['public']['Tables']['goals']['Row']

// UI表示用の Goal インターフェース
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
  initialGoals?: DbGoal[]
}

export function Goals({ initialGoals }: GoalsProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const t = useTranslations()
  const currentLocale = useLocale()
  
  // データベースフック（初期データがある場合は初期化）
  const { 
    goals: dbGoals, 
    loading, 
    error, 
    deleteGoal: deleteGoalFromDb 
  } = useGoalsDb(initialGoals)

  // サブスクリプション情報
  const { userPlan } = useSubscriptionContext()

  // ローカルステート
  const [goals, setGoals] = useState<Goal[]>([])
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null) // 操作失敗エラー用
  const [showErrorModal, setShowErrorModal] = useState(false) // エラーモーダル表示制御

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
      return `${hours}\u2009h ${minutes}\u2009min`
    }
    return `${minutes}\u2009min`
  }

  // エラーが発生したらモーダルを表示
  useEffect(() => {
    if (error || operationError) {
      setShowErrorModal(true)
    }
  }, [error, operationError])

  // dont_listをパースする関数
  const parseDontList = (dontList: string | null): string[] => {
    if (!dontList) return []
    try {
      const parsed = JSON.parse(dontList)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // データベースからの目標を変換
  useEffect(() => {
    if (dbGoals) {
      const convertedGoals: Goal[] = dbGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        motivation: goal.dont_list || '',
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
    // プラン制限をチェック
    const goalLimit = userPlan === 'free' ? 0 : userPlan === 'starter' ? 1 : userPlan === 'standard' ? 3 : Infinity
    
    if (goals.length >= goalLimit) {
      // 制限に達している場合はモーダルを表示
      setShowLimitModal(true)
      return
    }
    
    // 制限内の場合は追加ページへ遷移
    router.push(`/${locale}/goals/add`)
  }

  const handleEditGoal = (goalId: string) => {
    router.push(`/${locale}/goals/edit/${goalId}`)
  }

  const handleDeleteClick = (goalId: string) => {
    setSelectedGoalId(goalId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedGoalId) return
    
    setIsDeleting(true)
    const result = await deleteGoalFromDb(selectedGoalId)
    setIsDeleting(false)
    
    if (result.success) {
      // 削除成功時のみダイアログを閉じる
      setDeleteDialogOpen(false)
      setSelectedGoalId(null)
    } else {
      // エラー時はダイアログを閉じてからエラーを表示
      setDeleteDialogOpen(false)
      setSelectedGoalId(null)
      setOperationError(result.error || t('goals.delete_error'))
    }
  }

  return (
    <div className="text-white">
      {/* エラーモーダル */}
      <ErrorModal
        isOpen={showErrorModal && !!(error || operationError)}
        onClose={() => {
          // エラーステートとモーダル表示をクリア
          setOperationError(null)
          setShowErrorModal(false)
        }}
        message={error || operationError || ''}
      />

      {/* プラン制限モーダル */}
      <GoalLimitModal 
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        currentPlan={userPlan}
        currentGoalCount={goals.length}
      />

      <div className="container mx-auto max-w-4xl">
        {/* 目標追加ボタン - モバイル用右下固定 */}
        {goals.length > 0 && (
          <div className="fixed bottom-24 right-6 z-[60] md:hidden">
            <Button
              onClick={handleAddGoal}
              className="bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 w-14 h-14 rounded-2xl p-0 transition-all duration-300 hover:scale-110 active:scale-95"
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
              <div 
                key={goal.id} 
                className="relative overflow-hidden rounded-xl border border-white/10 bg-card/40 backdrop-blur-md transition-all duration-300 hover:bg-card/60 hover:border-white/20 hover:shadow-lg hover:shadow-purple-900/10 group"
              >
                 <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent" />
                
                <div className="p-6 relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{goal.title}</h3>
                      {goal.motivation && (() => {
                        const dontDoTags = parseDontList(goal.motivation)
                        return dontDoTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {dontDoTags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-900/40 border border-gray-700 text-gray-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGoal(goal.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(goal.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* 期限と時間設定がある場合のみ表示 */}
                  {((goal.deadline && goal.deadline !== '') || (goal.weekdayHours && goal.weekdayHours > 0) || (goal.weekendHours && goal.weekendHours > 0)) ? (
                    <>
                      {/* 進捗表示 */}
                      {(goal.targetDurationSeconds && goal.targetDurationSeconds > 0) && (
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-gray-400">{t('goals.progress_status')}</span>
                            <span className="text-white">
                              {goal.currentValueSeconds ? formatSecondsToTimeString(goal.currentValueSeconds) : `${goal.currentValue}h`} / {goal.targetDurationSeconds ? formatSecondsToTimeString(goal.targetDurationSeconds) : `${goal.targetValue}h`} 
                              <span className="ml-1 text-emerald-400">({progressPercentage.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-700 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 期限と残り日数 */}
                      {goal.deadline && (
                        <div className="flex items-center justify-between text-xs mt-4 bg-white/5 rounded-lg p-2 border border-white/5">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-300">{formatISODateForLocale(goal.deadline, currentLocale)}</span>
                          </div>
                          <div className={`flex items-center space-x-1 font-medium ${
                            isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-blue-400'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {isOverdue 
                                ? t('goals.days_overdue', { days: Math.abs(remainingDays) })
                                : t('goals.days_remaining', { days: remainingDays })
                              }
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 取り組み時間の詳細 */}
                      {((goal.weekdayHours && goal.weekdayHours > 0) || (goal.weekendHours && goal.weekendHours > 0)) && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                            <span className="text-[10px] tracking-wider text-gray-500 block mb-0.5">{t('goals.weekday')}</span>
                            <span className="text-sm font-medium text-white">{goal.weekdayHours}h</span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                            <span className="text-[10px] tracking-wider text-gray-500 block mb-0.5">{t('goals.weekend')}</span>
                            <span className="text-sm font-medium text-white">{goal.weekendHours}h</span>
                          </div>
                          <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                            <span className="text-[10px] tracking-wider text-gray-500 block mb-0.5">{t('goals.weekly')}</span>
                            <span className="text-sm font-medium text-white">{weeklyHours}h</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>

        {/* 目標追加ボタン - PC用 */}
        {goals.length > 0 && (
          <div className="mt-8 text-center hidden md:block">
            <Button
              onClick={handleAddGoal}
              className="bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20 px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            >
              <Plus className="w-6 h-6 mr-2" />
              {t('goals.add_goal')}
            </Button>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-white/10">
            <h3 className="text-xl font-medium text-white mb-6">{t('goals.set_goal_message')}</h3>
            <Button
              onClick={handleAddGoal}
              className="bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-900/20 px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('goals.set_goal')}
            </Button>
          </div>
        )}
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent 
          className="bg-gray-800 border-gray-700 text-white"
          onOverlayClick={() => setDeleteDialogOpen(false)}
          onInteractOutside={(e) => {
            e.preventDefault()
            setDeleteDialogOpen(false)
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            setDeleteDialogOpen(false)
          }}
        >
          <AlertDialogHeader>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-7 h-7 p-0 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <AlertDialogTitle className="text-red-400">
              {t('goals.delete_confirmation_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {t('goals.delete_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-destructive text-white transition-colors"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('goals.deleting')}</span>
                </div>
              ) : (
                t('goals.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 目標管理の公開関数（アクティビティから使用）
export const getActiveGoals = (): Goal[] => {
  // ここは実際の実装では状態管理ライブラリやAPIから取得
  return []
} 