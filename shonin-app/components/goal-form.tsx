"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface GoalFormData {
  title: string
  motivation: string
  deadline: string
  weekdayHours: string
  weekendHours: string
  calculatedHours: number
}

interface ValidationErrors {
  weekdayHours: string
  weekendHours: string
}

interface GoalFormProps {
  mode: "create" | "edit"
  initialData?: Partial<GoalFormData>
  onSubmit: (data: GoalFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GoalForm({ 
  mode, 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  isSubmitting = false 
}: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData.title || "",
    motivation: initialData.motivation || "",
    deadline: initialData.deadline || "",
    weekdayHours: initialData.weekdayHours || "",
    weekendHours: initialData.weekendHours || "",
    calculatedHours: initialData.calculatedHours || 0
  })

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    weekdayHours: "",
    weekendHours: ""
  })

  // バリデーション関数
  const validateHours = (value: string): { isValid: boolean; numValue: number; error: string } => {
    if (value.trim() === '') {
      return { isValid: true, numValue: 0, error: '' }
    }
    
    const num = parseInt(value, 10)
    
    if (isNaN(num)) {
      return { isValid: false, numValue: 0, error: '無効な値です。数字を入力してください。' }
    }
    
    if (num < 0) {
      return { isValid: false, numValue: 0, error: '0以上の数字を入力してください。' }
    }
    
    if (num > 24) {
      return { isValid: false, numValue: 0, error: '24以下の数字を入力してください。' }
    }
    
    return { isValid: true, numValue: num, error: '' }
  }

  // 自動計算関数
  const calculateTotalHours = (deadline: string, weekdayHours: number, weekendHours: number) => {
    if (!deadline || weekdayHours === 0 && weekendHours === 0) return 0
    
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return 0
    
    // 週数を計算
    const weeks = Math.floor(diffDays / 7)
    const remainingDays = diffDays % 7
    
    // 平日5日 * 週数 + 土日2日 * 週数
    let totalHours = (weekdayHours * 5 * weeks) + (weekendHours * 2 * weeks)
    
    // 残りの日数分を計算（簡易版：平日として計算）
    totalHours += weekdayHours * remainingDays
    
    return Math.round(totalHours)
  }

  // 週間時間の計算
  const calculateWeeklyHours = (weekdayHours: number, weekendHours: number) => {
    return (weekdayHours * 5) + (weekendHours * 2)
  }

  // 月間時間の計算
  const calculateMonthlyHours = (weekdayHours: number, weekendHours: number) => {
    return calculateWeeklyHours(weekdayHours, weekendHours) * 4
  }

  // 自動計算の実行
  useEffect(() => {
    const weekdayValidation = validateHours(formData.weekdayHours)
    const weekendValidation = validateHours(formData.weekendHours)
    
    if (weekdayValidation.isValid && weekendValidation.isValid) {
      const calculated = calculateTotalHours(
        formData.deadline, 
        weekdayValidation.numValue, 
        weekendValidation.numValue
      )
      setFormData(prev => ({ ...prev, calculatedHours: calculated }))
    }
  }, [formData.deadline, formData.weekdayHours, formData.weekendHours])

  const handleSubmit = () => {
    // バリデーションチェック
    const weekdayValidation = validateHours(formData.weekdayHours)
    const weekendValidation = validateHours(formData.weekendHours)
    
    // エラーメッセージを設定
    setValidationErrors({
      weekdayHours: weekdayValidation.error,
      weekendHours: weekendValidation.error
    })
    
    // バリデーションに失敗した場合は保存を中止
    if (!weekdayValidation.isValid || !weekendValidation.isValid) {
      return
    }
    
    if (!formData.title || !formData.deadline || formData.calculatedHours === 0) return

    // 数値に変換したデータで送信
    const submitData: GoalFormData = {
      ...formData,
      weekdayHours: weekdayValidation.numValue.toString(),
      weekendHours: weekendValidation.numValue.toString()
    }

    onSubmit(submitData)
  }

  const weekdayHours = parseInt(formData.weekdayHours) || 0
  const weekendHours = parseInt(formData.weekendHours) || 0

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label className="text-gray-300">目標 *</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="〇〇までに転職を成功させる"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-gray-300">理由 *</Label>
        <Textarea
          value={formData.motivation}
          onChange={(e) => setFormData({...formData, motivation: e.target.value})}
          placeholder="転職を成功させて年収を100万円アップさせる"
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-gray-300">期限 *</Label>
          <Input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-300">平日（月〜金）の時間</Label>
          <Input
            type="text"
            value={formData.weekdayHours}
            onChange={(e) => {
              const value = e.target.value
              setFormData({...formData, weekdayHours: value})
            }}
            placeholder="2"
            className="bg-gray-800 border-gray-700 text-white"
          />
          {validationErrors.weekdayHours && (
            <div className="text-xs text-red-400">{validationErrors.weekdayHours}</div>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-gray-300">土日の時間</Label>
          <Input
            type="text"
            value={formData.weekendHours}
            onChange={(e) => {
              const value = e.target.value
              setFormData({...formData, weekendHours: value})
            }}
            placeholder="5"
            className="bg-gray-800 border-gray-700 text-white"
          />
          {validationErrors.weekendHours && (
            <div className="text-xs text-red-400">{validationErrors.weekendHours}</div>
          )}
        </div>
      </div>

      {/* 自動計算結果 */}
      {formData.calculatedHours > 0 && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-start md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">週間: </span>
              <span className="text-white">{calculateWeeklyHours(weekdayHours, weekendHours)}時間</span>
            </div>
            <div>
              <span className="text-gray-400">月間: </span>
              <span className="text-white">{calculateMonthlyHours(weekdayHours, weekendHours)}時間</span>
            </div>
            <div>
              <span className="text-gray-400">総目標: </span>
              <span className="text-white font-medium">{formData.calculatedHours}時間</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-green-500 hover:bg-green-600"
        >
          {mode === "create" ? "目標を追加" : "保存"}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
          className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
        >
          キャンセル
        </Button>
      </div>
    </div>
  )
} 