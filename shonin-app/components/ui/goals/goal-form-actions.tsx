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
    <div className="flex space-x-4 pt-4 border-t border-white/5 mt-4 justify-end">
      <Button 
        variant="ghost" 
        onClick={onCancel}
        disabled={isSubmitting}
        className="text-gray-400 hover:text-white hover:bg-white/5"
      >
        {t('goals.cancel')}
      </Button>
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting || !isValid}
        className="bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 border-0 px-8 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:bg-gray-700 disabled:text-gray-300 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isSubmitting 
          ? (mode === "create" ? t('goals.creating') : t('goals.saving'))
          : (mode === "create" ? t('goals.create') : t('goals.save'))
        }
      </Button>
    </div>
  )
} 