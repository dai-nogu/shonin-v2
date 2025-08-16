"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GoalTitleInput } from "../goal-title-input"
import { GoalMotivationTextarea } from "../goal-motivation-textarea"
import { GoalDeadlineInput } from "../goal-deadline-input"
import { GoalHoursInputs } from "../goal-hours-inputs"
import { GoalCalculationDisplay } from "../goal-calculation-display"
import { GoalFormActions } from "../goal-form-actions"
import { useGoalForm } from "@/hooks/use-goal-form"
import { useSingleGoal, useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db"

interface GoalEditContainerProps {
  params: Promise<{
    id: string
  }>
}

export function GoalEditContainer({ params }: GoalEditContainerProps) {
  const router = useRouter()
  const { updateGoal } = useGoalsDb()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // paramsをunwrap
  const { id } = use(params)
  
  // 目標を取得
  const { goal, loading, error } = useSingleGoal(id)
  
  // フォーム管理
  const {
    formData,
    validationErrors,
    updateField,
    setInitialData,
    validateForm,
    weeklyHours,
    monthlyHours
  } = useGoalForm()

  // 目標データが取得できたらフォームに設定
  useEffect(() => {
    if (goal) {
      setInitialData({
        title: goal.title,
        motivation: goal.description || '',
        deadline: goal.deadline || '',
        weekdayHours: (goal.weekday_hours || 0).toString(),
        weekendHours: (goal.weekend_hours || 0).toString()
      })
    }
  }, [goal, setInitialData])

  const handleUpdateGoal = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const goalData: DbGoalFormData = {
        title: formData.title,
        motivation: formData.motivation,
        deadline: formData.deadline,
        weekdayHours: parseInt(formData.weekdayHours),
        weekendHours: parseInt(formData.weekendHours),
        calculatedHours: formData.calculatedHours
      }

      const success = await updateGoal(id, goalData)
      
      if (success) {
        router.push("/goals")
      } else {
        alert('目標の更新に失敗しました')
      }
    } catch (error) {
      console.error('目標更新エラー:', error)
      alert('目標の更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/goals")
  }

  // ローディング中またはエラーの場合
  if (loading || error || !goal) {
    return (
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="text-center text-white">
              {loading ? "読み込み中..." : error || "目標が見つかりません"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">目標を編集</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <GoalTitleInput
            value={formData.title}
            onChange={(value) => updateField("title", value)}
          />

          <GoalMotivationTextarea
            value={formData.motivation}
            onChange={(value) => updateField("motivation", value)}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GoalDeadlineInput
              value={formData.deadline}
              onChange={(value) => updateField("deadline", value)}
            />
            
            <div className="md:col-span-2">
              <GoalHoursInputs
                weekdayHours={formData.weekdayHours}
                weekendHours={formData.weekendHours}
                onWeekdayHoursChange={(value) => updateField("weekdayHours", value)}
                onWeekendHoursChange={(value) => updateField("weekendHours", value)}
                validationErrors={validationErrors}
              />
            </div>
          </div>

          <GoalCalculationDisplay
            weeklyHours={weeklyHours}
            monthlyHours={monthlyHours}
            totalHours={formData.calculatedHours}
          />

          <GoalFormActions
            mode="edit"
            onSubmit={handleUpdateGoal}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isValid={formData.title.trim() !== "" && formData.deadline !== "" && formData.calculatedHours > 0}
          />
        </CardContent>
      </Card>
    </div>
  )
} 