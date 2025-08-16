"use client"

import { Button } from "@/components/ui/button"

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
  return (
    <div className="flex space-x-3">
      <Button 
        variant="outline" 
        onClick={onCancel}
        disabled={isSubmitting}
        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
      >
        キャンセル
      </Button>
      <Button 
        onClick={onSubmit} 
        disabled={isSubmitting || !isValid}
        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600"
      >
        {mode === "create" ? "目標を追加" : "保存"}
      </Button>
    </div>
  )
} 