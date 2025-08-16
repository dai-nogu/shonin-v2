import { useState, useEffect } from "react"

export interface GoalFormData {
  title: string
  motivation: string
  deadline: string
  weekdayHours: string
  weekendHours: string
  calculatedHours: number
}

export interface ValidationErrors {
  weekdayHours: string
  weekendHours: string
}

export function useGoalForm(initialData?: Partial<GoalFormData>) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: initialData?.title || "",
    motivation: initialData?.motivation || "",
    deadline: initialData?.deadline || "",
    weekdayHours: initialData?.weekdayHours || "",
    weekendHours: initialData?.weekendHours || "",
    calculatedHours: initialData?.calculatedHours || 0
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

  const updateField = <K extends keyof GoalFormData>(field: K, value: GoalFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const weekdayValidation = validateHours(formData.weekdayHours)
    const weekendValidation = validateHours(formData.weekendHours)
    
    setValidationErrors({
      weekdayHours: weekdayValidation.error,
      weekendHours: weekendValidation.error
    })
    
    return weekdayValidation.isValid && weekendValidation.isValid && 
           formData.title.trim() !== "" && formData.deadline !== "" && formData.calculatedHours > 0
  }

  const weekdayHours = parseInt(formData.weekdayHours) || 0
  const weekendHours = parseInt(formData.weekendHours) || 0

  return {
    formData,
    validationErrors,
    updateField,
    validateForm,
    weeklyHours: calculateWeeklyHours(weekdayHours, weekendHours),
    monthlyHours: calculateMonthlyHours(weekdayHours, weekendHours)
  }
} 