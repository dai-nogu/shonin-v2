"use client"

import { useState, useEffect } from "react"
import { Plus, Target, Calendar, Clock, Edit2, Trash2, Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useGoalsDb, type GoalFormData } from "@/hooks/use-goals-db"

interface Goal {
  id: string
  title: string
  motivation: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  weekdayHours: number
  weekendHours: number
  createdAt: string
  status: "active" | "completed" | "paused"
  // 生の秒値も保持
  targetDurationSeconds?: number
  currentValueSeconds?: number
}

interface GoalsProps {
  onBack: () => void
}

export function Goals({ onBack }: GoalsProps) {
  // データベースフック
  const { 
    goals: dbGoals, 
    loading, 
    error, 
    addGoal, 
    updateGoal, 
    deleteGoal: deleteGoalFromDb 
  } = useGoalsDb()

  // ローカルステート
  const [goals, setGoals] = useState<Goal[]>([])
  const [isAddingGoal, setIsAddingGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: "",
    motivation: "",
    unit: "時間",
    deadline: "",
    weekdayHours: "" as any,
    weekendHours: "" as any,
    calculatedHours: 0
  })
  const [editGoal, setEditGoal] = useState({
    title: "",
    motivation: "",
    unit: "時間",
    deadline: "",
    weekdayHours: 0,
    weekendHours: 0,
    calculatedHours: 0
  })
  
  // 入力中の値を管理する状態
  const [editInputValues, setEditInputValues] = useState({
    weekdayHours: "",
    weekendHours: ""
  })
  
  // バリデーションエラー状態
  const [validationErrors, setValidationErrors] = useState({
    weekdayHours: "",
    weekendHours: ""
  })
  const [newGoalValidationErrors, setNewGoalValidationErrors] = useState({
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

  // 秒を時間.分の小数形式に変換する関数
  const formatSecondsToDecimalHours = (seconds: number): number => {
    return Math.round((seconds / 3600) * 100) / 100 // 小数点2桁で四捨五入
  }

  // 秒を時間:分の文字列形式に変換する関数
  const formatSecondsToTimeString = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // データベースからの目標を変換
  useEffect(() => {
    if (dbGoals) {
      const convertedGoals: Goal[] = dbGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        motivation: goal.description || '',
        targetValue: formatSecondsToDecimalHours(goal.target_duration || 0), // 秒から小数時間に変換
        currentValue: formatSecondsToDecimalHours(goal.current_value || 0), // 秒から小数時間に変換
        unit: goal.unit || '時間',
        deadline: goal.deadline || '',
        weekdayHours: goal.weekday_hours || 0,
        weekendHours: goal.weekend_hours || 0,
        createdAt: goal.created_at.split('T')[0],
        status: goal.status || 'active',
        // 生の秒値も保持
        targetDurationSeconds: goal.target_duration || 0,
        currentValueSeconds: goal.current_value || 0
      }))
      setGoals(convertedGoals)
    }
  }, [dbGoals])

  // 新規目標の自動計算
  useEffect(() => {
    const calculated = calculateTotalHours(newGoal.deadline, newGoal.weekdayHours, newGoal.weekendHours)
    setNewGoal(prev => ({ ...prev, calculatedHours: calculated }))
  }, [newGoal.deadline, newGoal.weekdayHours, newGoal.weekendHours])

  // 編集目標の自動計算
  useEffect(() => {
    const calculated = calculateTotalHours(editGoal.deadline, editGoal.weekdayHours, editGoal.weekendHours)
    setEditGoal(prev => ({ ...prev, calculatedHours: calculated }))
  }, [editGoal.deadline, editGoal.weekdayHours, editGoal.weekendHours])

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getRemainingDays = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleAddGoal = async () => {
    // バリデーションチェック
    const weekdayValidation = validateHours(newGoal.weekdayHours)
    const weekendValidation = validateHours(newGoal.weekendHours)
    
    // エラーメッセージを設定
    setNewGoalValidationErrors({
      weekdayHours: weekdayValidation.error,
      weekendHours: weekendValidation.error
    })
    
    // バリデーションに失敗した場合は保存を中止
    if (!weekdayValidation.isValid || !weekendValidation.isValid) {
      console.log('Validation failed:', { weekdayValidation, weekendValidation })
      return
    }
    
    const weekdayHours = weekdayValidation.numValue
    const weekendHours = weekendValidation.numValue
    const calculatedHours = calculateTotalHours(newGoal.deadline, weekdayHours, weekendHours)
    
    if (!newGoal.title || !newGoal.deadline || calculatedHours === 0) return

    console.log('handleAddGoal called with newGoal:', newGoal)
    console.log('Validated values:', { weekdayHours, weekendHours, calculatedHours })

    const goalData: GoalFormData = {
      title: newGoal.title,
      motivation: newGoal.motivation,
      deadline: newGoal.deadline,
      weekdayHours: weekdayHours,
      weekendHours: weekendHours,
      calculatedHours: calculatedHours
    }

    console.log('Sending goalData to addGoal:', goalData)

    const goalId = await addGoal(goalData)
    
    if (goalId) {
      console.log('Goal added successfully with ID:', goalId)
      setNewGoal({
        title: "",
        motivation: "",
        unit: "時間",
        deadline: "",
        weekdayHours: "" as any,
        weekendHours: "" as any,
        calculatedHours: 0
      })
      setNewGoalValidationErrors({
        weekdayHours: "",
        weekendHours: ""
      })
      setIsAddingGoal(false)
    } else {
      alert('目標の追加に失敗しました')
    }
  }

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (goal) {
      console.log('Editing goal:', goal)
      console.log('Goal weekdayHours:', goal.weekdayHours, 'weekendHours:', goal.weekendHours)
      
      const editData = {
        title: goal.title,
        motivation: goal.motivation,
        unit: goal.unit,
        deadline: goal.deadline,
        weekdayHours: goal.weekdayHours || 0,
        weekendHours: goal.weekendHours || 0,
        calculatedHours: goal.targetValue || 0
      }
      
      console.log('Setting editGoal to:', editData)
      setEditGoal(editData)
      setEditInputValues({
        weekdayHours: (goal.weekdayHours || 0).toString(),
        weekendHours: (goal.weekendHours || 0).toString()
      })
      setEditingGoal(goalId)
    }
  }

  const handleUpdateGoal = async () => {
    if (!editGoal.title || !editGoal.deadline || !editingGoal) return

    console.log('handleUpdateGoal called with editGoal:', editGoal)
    console.log('editInputValues:', editInputValues)

    // バリデーションチェック
    const weekdayValidation = validateHours(editInputValues.weekdayHours)
    const weekendValidation = validateHours(editInputValues.weekendHours)
    
    // エラーメッセージを設定
    setValidationErrors({
      weekdayHours: weekdayValidation.error,
      weekendHours: weekendValidation.error
    })
    
    // バリデーションに失敗した場合は保存を中止
    if (!weekdayValidation.isValid || !weekendValidation.isValid) {
      console.log('Validation failed:', { weekdayValidation, weekendValidation })
      return
    }
    
    const weekdayHours = weekdayValidation.numValue
    const weekendHours = weekendValidation.numValue
    
    console.log('Validated values:', { weekdayHours, weekendHours })

    const calculatedTargetValue = calculateTotalHours(editGoal.deadline, weekdayHours, weekendHours)

    const goalData: GoalFormData = {
      title: editGoal.title,
      motivation: editGoal.motivation,
      deadline: editGoal.deadline,
      weekdayHours: weekdayHours,
      weekendHours: weekendHours,
      calculatedHours: calculatedTargetValue
    }

    console.log('Sending goalData to updateGoal:', goalData)

    const success = await updateGoal(editingGoal, goalData)
    
    if (success) {
      console.log('Goal updated successfully')
      setEditGoal({
        title: "",
        motivation: "",
        unit: "時間",
        deadline: "",
        weekdayHours: 0,
        weekendHours: 0,
        calculatedHours: 0
      })
      setEditInputValues({
        weekdayHours: "",
        weekendHours: ""
      })
      setValidationErrors({
        weekdayHours: "",
        weekendHours: ""
      })
      setEditingGoal(null)
    } else {
      alert('目標の更新に失敗しました')
    }
  }

  const handleCancelEdit = () => {
    setEditingGoal(null)
    setEditGoal({
      title: "",
      motivation: "",
      unit: "時間",
      deadline: "",
      weekdayHours: 0,
      weekendHours: 0,
      calculatedHours: 0
    })
    setEditInputValues({
      weekdayHours: "",
      weekendHours: ""
    })
    setValidationErrors({
      weekdayHours: "",
      weekendHours: ""
    })
  }

  const handleDeleteGoal = async (goalId: string) => {
    const confirmed = confirm("この目標を削除しますか？")
    if (confirmed) {
      const success = await deleteGoalFromDb(goalId)
      if (!success) {
        alert('目標の削除に失敗しました')
      }
    }
  }





  // ローディング状態
  if (loading) {
    return (
      <div className="bg-gray-950 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">目標を読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="bg-gray-950 text-white">{/* ヘッダーは統一Header使用のため削除 */}
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">エラーが発生しました: {error}</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
              再読み込み
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-950 text-white">{/* ヘッダーは統一Header使用のため削除 */}

      <div className="container mx-auto max-w-4xl">
        {/* 目標追加ボタン */}
        {!isAddingGoal && goals.length > 0 && (
          <div className="mb-6">
            <Button
              onClick={() => setIsAddingGoal(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              目標を追加
            </Button>
          </div>
        )}

        {/* 目標追加フォーム */}
        {isAddingGoal && (
          <Card className="bg-gray-900 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">目標を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">目標 *</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  placeholder="〇〇までに転職を成功させる"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">理由 *</Label>
                <Textarea
                  value={newGoal.motivation}
                  onChange={(e) => setNewGoal({...newGoal, motivation: e.target.value})}
                  placeholder="転職を成功させて年収を100万円アップさせる"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">期限 *</Label>
                  <Input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">平日（月〜金）の時間</Label>
                  <Input
                    type="text"
                    value={newGoal.weekdayHours}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewGoal({...newGoal, weekdayHours: value})
                    }}
                    placeholder="2"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {newGoalValidationErrors.weekdayHours && (
                    <div className="text-xs text-red-400">{newGoalValidationErrors.weekdayHours}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">土日の時間</Label>
                  <Input
                    type="text"
                    value={newGoal.weekendHours}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewGoal({...newGoal, weekendHours: value})
                    }}
                    placeholder="5"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  {newGoalValidationErrors.weekendHours && (
                    <div className="text-xs text-red-400">{newGoalValidationErrors.weekendHours}</div>
                  )}
                </div>
              </div>

              {/* 自動計算結果 */}
              {newGoal.calculatedHours > 0 && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">週間: </span>
                      <span className="text-white">{calculateWeeklyHours(newGoal.weekdayHours, newGoal.weekendHours)}時間</span>
                    </div>
                    <div>
                      <span className="text-gray-400">月間: </span>
                      <span className="text-white">{calculateMonthlyHours(newGoal.weekdayHours, newGoal.weekendHours)}時間</span>
                    </div>
                    <div>
                      <span className="text-gray-400">総目標: </span>
                      <span className="text-white font-medium">{newGoal.calculatedHours}時間</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button onClick={handleAddGoal} className="bg-green-500 hover:bg-green-600">
                  目標を追加
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingGoal(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 目標一覧 */}
        <div className="space-y-6">
          {goals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal.currentValue, goal.targetValue)
            const remainingDays = getRemainingDays(goal.deadline)
            const isOverdue = remainingDays < 0
            const isUrgent = remainingDays <= 7 && remainingDays >= 0
            const weeklyHours = calculateWeeklyHours(goal.weekdayHours, goal.weekendHours)

            const isEditing = editingGoal === goal.id

            return (
              <Card key={goal.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* タイトル編集 */}
                      {isEditing ? (
                        <div className="space-y-2 mb-3">
                          <Label className="text-gray-300 text-sm">目標タイトル</Label>
                          <Input
                            value={editGoal.title}
                            onChange={(e) => setEditGoal({...editGoal, title: e.target.value})}
                            className="bg-gray-800 border-gray-700 text-white text-xl font-bold"
                          />
                        </div>
                      ) : (
                        <CardTitle className="text-white text-xl mb-3">{goal.title}</CardTitle>
                      )}
                      
                      {/* 動機編集 */}
                      <div className="bg-gray-800 p-3 rounded-lg mb-4">
                        {isEditing ? (
                          <Textarea
                            value={editGoal.motivation}
                            onChange={(e) => setEditGoal({...editGoal, motivation: e.target.value})}
                            className="bg-gray-700 border-gray-600 text-white text-sm min-h-[60px]"
                          />
                        ) : (
                          <p className="text-sm text-white">{goal.motivation}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleUpdateGoal}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            保存
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          >
                            キャンセル
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditGoal(goal.id)}
                            className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 進捗表示 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">進捗状況</span>
                      <span className="text-sm font-medium text-white">
                        {goal.currentValueSeconds ? formatSecondsToTimeString(goal.currentValueSeconds) : `${goal.currentValue}h`} / {goal.targetDurationSeconds ? formatSecondsToTimeString(goal.targetDurationSeconds) : `${goal.targetValue}h`} ({Math.round(progressPercentage)}%)
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* 期限と残り日数 */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 text-xs">期限:</span>
                          <Input
                            type="date"
                            value={editGoal.deadline}
                            onChange={(e) => setEditGoal({...editGoal, deadline: e.target.value})}
                            className="bg-gray-800 border-gray-700 text-white h-7 text-xs w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400">期限: {goal.deadline}</span>
                      )}
                    </div>
                    {!isEditing && (
                      <div className={`flex items-center space-x-1 ${
                        isOverdue ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span>
                          {isOverdue 
                            ? `${Math.abs(remainingDays)}日遅れ` 
                            : `残り${remainingDays}日`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 取り組み時間の詳細 */}
                  <div className="bg-gray-800 p-3 rounded-lg">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-300 text-sm">平日（月〜金）の時間</Label>
                            <Input
                              type="text"
                              value={editInputValues.weekdayHours}
                              onChange={(e) => {
                                const value = e.target.value
                                console.log('Input:', value)
                                setEditInputValues({...editInputValues, weekdayHours: value})
                              }}
                              className="bg-gray-700 border-gray-600 text-white h-8"
                              placeholder="2"
                            />
                            {validationErrors.weekdayHours && (
                              <div className="text-xs text-red-400">{validationErrors.weekdayHours}</div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-gray-300 text-sm">土日の時間</Label>
                            <Input
                              type="text"
                              value={editInputValues.weekendHours}
                              onChange={(e) => {
                                const value = e.target.value
                                console.log('Weekend Input:', value)
                                setEditInputValues({...editInputValues, weekendHours: value})
                              }}
                              className="bg-gray-700 border-gray-600 text-white h-8"
                              placeholder="5"
                            />
                            {validationErrors.weekendHours && (
                              <div className="text-xs text-red-400">{validationErrors.weekendHours}</div>
                            )}
                          </div>
                        </div>
                        
                        {/* 自動計算結果 */}
                        {editGoal.calculatedHours > 0 && (
                          <div className="bg-gray-700 p-3 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">週間: </span>
                                <span className="text-white">{calculateWeeklyHours(editGoal.weekdayHours, editGoal.weekendHours)}時間</span>
                              </div>
                              <div>
                                <span className="text-gray-400">月間: </span>
                                <span className="text-white">{calculateMonthlyHours(editGoal.weekdayHours, editGoal.weekendHours)}時間</span>
                              </div>
                              <div>
                                <span className="text-gray-400">総目標: </span>
                                <span className="text-white font-medium">{editGoal.calculatedHours}時間</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-400">平日: </span>
                          <span className="text-white">{goal.weekdayHours}時間/日</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          <span className="text-gray-400">土日: </span>
                          <span className="text-white">{goal.weekendHours}時間/日</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span className="text-gray-400">週間: </span>
                          <span className="text-white">{weeklyHours}時間</span>
                        </div>
                      </div>
                    )}
                  </div>


                </CardContent>
              </Card>
            )
          })}
        </div>

        {!loading && goals.length === 0 && !isAddingGoal && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">目標を設定しよう</h3>
            <Button
              onClick={() => setIsAddingGoal(true)}
              className="bg-green-500 hover:bg-green-600 px-8 md:px-12 py-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              目標を設定する
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// 目標管理の公開関数（アクティビティから使用）
export const getActiveGoals = (): Goal[] => {
  // ここは実際の実装では状態管理ライブラリやAPIから取得
  return []
} 