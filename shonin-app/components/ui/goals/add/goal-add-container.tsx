"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { GoalTitleInput } from "../goal-title-input"
import { GoalMotivationTextarea } from "../goal-motivation-textarea"
import { GoalDeadlineInput } from "../goal-deadline-input"
import { GoalHoursInputs } from "../goal-hours-inputs"
import { GoalCalculationDisplay } from "../goal-calculation-display"
import { GoalFormActions } from "../goal-form-actions"
import { useGoalForm } from "@/hooks/use-goal-form"
import { useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db"

export function GoalAddContainer() {
  const router = useRouter()
  const { addGoal } = useGoalsDb()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

      const goalId = await addGoal(goalData)
      
      if (goalId) {
        router.push("/goals")
      } else {
        alert('目標の追加に失敗しました')
      }
    } catch (error) {
      console.error('目標追加エラー:', error)
      alert('目標の追加に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/goals")
  }

  return (
    <div className="container mx-auto max-w-4xl">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">目標を追加</CardTitle>
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
            mode="create"
            onSubmit={handleAddGoal}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            isValid={formData.title.trim() !== "" && formData.deadline !== "" && formData.calculatedHours > 0}
          />
        </CardContent>
      </Card>
    </div>
  )
} 