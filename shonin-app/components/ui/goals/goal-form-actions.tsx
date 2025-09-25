"use client"

import { Button } from "@/components/ui/common/button"
import { useTranslations } from 'next-intl'

interface GoalFormActionsProps {
  mode: "create" | "edit"
  onSubmit: () => void
  onCancel: () => void
  isSubmitting?: boolean
  isValid?: boolean
}

export function GoalFormActions({ 
  mode, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  isValid = true
}: GoalFormActionsProps) {
  const t = useTranslations()
  
  return (
    <div className="flex space-x-3">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
      >
        {t('goals.cancel')}
      </Button>
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting || !isValid}
        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600"
      >
        {mode === "create" ? t('goals.create') : t('goals.save')}
      </Button>
    </div>
  )
} 