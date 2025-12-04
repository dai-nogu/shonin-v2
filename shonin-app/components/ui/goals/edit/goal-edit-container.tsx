"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { GoalTitleInput } from "../goal-title-input"
import { GoalMotivationTextarea } from "../goal-motivation-textarea"
import { GoalHoursInputs } from "../goal-hours-inputs"
import { GoalCalculationDisplay } from "../goal-calculation-display"
import { GoalFormActions } from "../goal-form-actions"
import { useGoalForm } from "@/hooks/use-goal-form"
import { useSingleGoal, useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { useTranslations } from 'next-intl'

interface GoalEditContainerProps {
  params: Promise<{
    id: string
  }>
}

export function GoalEditContainer({ params }: GoalEditContainerProps) {
  const router = useRouter()
  const routerParams = useParams()
  const locale = (routerParams?.locale as string) || 'ja'
  const { updateGoal } = useGoalsDb()
  const { handleAuthError } = useAuthRedirect()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations()
  
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

      const result = await updateGoal(id, goalData)
      
      // 認証エラーの場合は自動リダイレクト
      if (handleAuthError(result)) return
      
      if (result.success) {
        router.push(`/${locale}/goals`)
      }
      // エラーは useGoalsDb hook で既に処理されているので、ここでは何もしない
    } catch (error) {
      // エラーは useGoalsDb hook で既に処理されているので、重複処理は削除
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/${locale}/goals`)
  }

  // ローディング中またはエラーの場合
  if (loading || error || !goal) {
    return (
      <div className="container mx-auto max-w-3xl">
        <Card className="bg-card/30 border-white/10 backdrop-blur-md shadow-2xl">
          <CardContent className="p-6">
            <div className="text-center text-white">
              {loading ? t('goals.loading') : error || t('goals.goal_not_found')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="bg-card/30 border-white/10 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-2 border-b border-white/5 mb-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">{t('goals.editGoal')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <GoalTitleInput
            value={formData.title}
            onChange={(value) => updateField("title", value)}
          />

          <GoalMotivationTextarea
            value={formData.motivation}
            onChange={(value) => updateField("motivation", value)}
          />

          <GoalHoursInputs
            deadline={formData.deadline}
            onDeadlineChange={(value) => updateField("deadline", value)}
            weekdayHours={formData.weekdayHours}
            weekendHours={formData.weekendHours}
            onWeekdayHoursChange={(value) => updateField("weekdayHours", value)}
            onWeekendHoursChange={(value) => updateField("weekendHours", value)}
            validationErrors={validationErrors}
          />

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
            isValid={formData.title.trim() !== ""}
          />
        </CardContent>
      </Card>
    </div>
  )
} 