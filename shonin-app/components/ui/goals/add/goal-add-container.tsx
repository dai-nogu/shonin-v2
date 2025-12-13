"use client"

import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { GoalTitleInput } from "../goal-title-input"
import { GoalDontDoSelector } from "../goal-dont-do-selector"
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
  const searchParams = useSearchParams()
  const locale = (params?.locale as string) || 'ja'
  const fromDashboard = searchParams.get('from') === 'dashboard'
  const { addGoal } = useGoalsDb()
  const { handleAuthError } = useAuthRedirect()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dontDoTags, setDontDoTags] = useState<string[]>([])
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
        motivation: JSON.stringify(dontDoTags),
        deadline: formData.deadline,
        weekdayHours: parseInt(formData.weekdayHours),
        weekendHours: parseInt(formData.weekendHours),
        calculatedHours: formData.calculatedHours
      }

      const result = await addGoal(goalData)
      
      // 認証エラーの場合は自動リダイレクト
      if (handleAuthError(result)) return
      
      if (result.success) {
        // ダッシュボードから来た場合は、追加した目標を選択状態でダッシュボードに戻る
        if (fromDashboard && result.data) {
          // sessionStorageに保存（URLに露出させない）
          sessionStorage.setItem('selectedGoalFromAdd', result.data)
          router.push(`/${locale}/dashboard`)
        } else {
          router.push(`/${locale}/goals`)
        }
      }
      // エラーは useGoalsDb hook で既に処理されているので、ここでは何もしない
    } catch (error) {
      // エラーは useGoalsDb hook で既に処理されているので、重複処理は削除
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // ダッシュボードから来た場合はダッシュボードに戻る
    if (fromDashboard) {
      router.push(`/${locale}/dashboard`)
    } else {
      router.push(`/${locale}/goals`)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <Card className="bg-card/30 border-white/10 backdrop-blur-md shadow-2xl">
        <CardHeader className="pb-2 border-b border-white/5 mb-6">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">{t('goals.addGoal')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <GoalTitleInput
            value={formData.title}
            onChange={(value) => updateField("title", value)}
          />

          <GoalDontDoSelector
            selectedTags={dontDoTags}
            onChange={setDontDoTags}
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
            isValid={formData.title.trim() !== "" && dontDoTags.length > 0}
          />
        </CardContent>
      </Card>
    </div>
  )
} 