"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { GoalTitleInput } from "../goal-title-input"
import { GoalMotivationTextarea } from "../goal-motivation-textarea"
import { GoalHoursInputs } from "../goal-hours-inputs"
import { GoalCalculationDisplay } from "../goal-calculation-display"
import { GoalFormActions } from "../goal-form-actions"
import { useGoalForm } from "@/hooks/use-goal-form"
import { useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import { useTranslations } from 'next-intl'

export function GoalAddContainer() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const { addGoal } = useGoalsDb()
  const { handleAuthError } = useAuthRedirect()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useTranslations()
  
  const {
    formData,
    validationErrors,
    updateField,
    validateForm,
    weeklyHours,
    monthlyHours
  } = useGoalForm()

  const handleAddGoal = async () => {
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

      const result = await addGoal(goalData)
      
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

  return (
    <div className="container mx-auto max-w-4xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{t('goals.addGoal')}</CardTitle>
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
            mode="create"
            onSubmit={handleAddGoal}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isValid={formData.title.trim() !== ""}
          />
        </CardContent>
      </Card>
    </div>
  )
} 