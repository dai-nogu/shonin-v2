"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface GoalMotivationTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function GoalMotivationTextarea({ 
  value, 
  onChange, 
  placeholder = "転職を成功させて年収を100万円アップさせる" 
}: GoalMotivationTextareaProps) {
  return (
    <div className="space-y-1">
      <Label className="text-gray-300">理由 *</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-gray-800 border-gray-700 text-white"
      />
    </div>
  )
} 