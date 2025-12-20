"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { ErrorModal } from "@/components/ui/common/error-modal"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/common/dialog"
import { Plus, Play, X, Check, Target, ChevronRight, Pencil, Trash2, RefreshCw } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { useGoalsDb, type GoalFormData as DbGoalFormData } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import { useTranslations, useLocale } from 'next-intl'
import { getInputLimits } from "@/lib/input-limits"
import { GoalTitleInput } from "@/components/ui/goals/goal-title-input"
import { GoalDontDoSelector } from "@/components/ui/goals/goal-dont-do-selector"
import { GoalHoursInputs } from "@/components/ui/goals/goal-hours-inputs"
import { useGoalForm } from "@/hooks/use-goal-form"
import type { Activity, SessionData } from "./time-tracker"

interface ActivitySelectorProps {
  onStart: (session: SessionData) => void
}

export function ActivitySelector({ onStart }: ActivitySelectorProps) {
  const t = useTranslations()
  const locale = useLocale()
  const limits = getInputLimits(locale)
  const [selectedActivity, setSelectedActivity] = useState<string>("")
  const [location, setLocation] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [showLocationInput, setShowLocationInput] = useState(false) // 場所入力の表示状態
  const [showGoalForm, setShowGoalForm] = useState(false) // 目標追加フォームの表示状態
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null) // 編集中の目標ID
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false) // 削除確認ダイアログ
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null) // 削除対象の目標ID
  const [isDeletingGoal, setIsDeletingGoal] = useState(false) // 削除処理中
  const [dontDoTags, setDontDoTags] = useState<string[]>([]) // やめることタグ
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false) // 目標追加中
  const [rotationDegree, setRotationDegree] = useState(0) // 循環矢印の回転角度

  // 目標フォームフック
  const {
    formData: goalFormData,
    validationErrors: goalValidationErrors,
    updateField: updateGoalField,
    validateForm: validateGoalForm,
    setInitialData: resetGoalForm,
  } = useGoalForm()

  // 目標データを取得
  const { goals, addGoal, updateGoal, deleteGoal: deleteGoalFromDb } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()

  // 目標を選択肢として利用可能な形式に変換
  const availableGoals = goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    deadline: goal.deadline,
    dont_list: goal.dont_list,
    status: goal.status,
    target_duration: goal.target_duration,
    current_value: goal.current_value,
    weekday_hours: goal.weekday_hours,
    weekend_hours: goal.weekend_hours,
    unit: goal.unit,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
    user_id: goal.user_id
  }))

  // アクティブな目標のみをフィルタリング
  const activeGoals = availableGoals.filter(goal => goal.status === 'active')

  // 初期化：sessionStorageから選択された目標を復元するか、最初の目標を選択
  useEffect(() => {
    const goalIdFromStorage = sessionStorage.getItem('selectedGoalFromAdd')
    if (goalIdFromStorage) {
      setSelectedGoal(goalIdFromStorage)
      // 読み取り後すぐに削除
      sessionStorage.removeItem('selectedGoalFromAdd')
      // グローバルに保存
      sessionStorage.setItem('currentSelectedGoal', goalIdFromStorage)
    } else {
      // sessionStorageから現在の選択目標を復元
      const currentGoal = sessionStorage.getItem('currentSelectedGoal')
      if (currentGoal && activeGoals.some(g => g.id === currentGoal)) {
        setSelectedGoal(currentGoal)
      } else if (activeGoals.length > 0) {
        // デフォルトで最初の目標を選択
        setSelectedGoal(activeGoals[0].id)
        sessionStorage.setItem('currentSelectedGoal', activeGoals[0].id)
      }
    }
  }, [activeGoals.length])
  
  // 目標が変更されたらsessionStorageに保存
  useEffect(() => {
    if (selectedGoal && selectedGoal !== "none") {
      sessionStorage.setItem('currentSelectedGoal', selectedGoal)
    }
  }, [selectedGoal])
  
  const { activities: allActivities, loading: activitiesLoading, addActivity, deleteActivity } = useActivities()
  
  // 現在選択されている目標に紐づくアクティビティをフィルタリング
  // 目標が選択されていない場合はすべてのアクティビティを表示
  const customActivities = allActivities.filter(activity => {
    // 目標が選択されていない場合はすべて表示
    if (!selectedGoal) return true
    // goal_idがundefinedの場合も表示（古いデータ対応）
    if (activity.goal_id === undefined) return true
    // goal_idがnullの場合は、目標に紐づいていないアクティビティ
    if (activity.goal_id === null) return true
    // goal_idが一致する場合のみ表示
    return activity.goal_id === selectedGoal
  })
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null) // ホバー中のタグID
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityColor, setNewActivityColor] = useState("bg-sumi")
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  
  // 直接入力用の状態
  const [activityInput, setActivityInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isComposing, setIsComposing] = useState(false) // IME変換中フラグ
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const activityAreaRef = useRef<HTMLDivElement>(null) // タグと入力欄を含むエリア全体
  
  // 行動名入力フィールドのref
  const activityNameInputRef = useRef<HTMLInputElement>(null)
  const activityInputRef = useRef<HTMLInputElement>(null)

  // フォームが開いた時に行動名フィールドにフォーカス
  useEffect(() => {
    if (showAddForm && activityNameInputRef.current) {
      activityNameInputRef.current.focus()
    }
  }, [showAddForm])

  // 入力からフィルタリングしたサジェスト
  const filteredActivities = customActivities.filter(activity =>
    activity.name.toLowerCase().includes(activityInput.toLowerCase())
  )
  
  // 入力値が既存アクティビティに完全一致するかチェック
  const exactMatch = customActivities.find(
    activity => activity.name.toLowerCase() === activityInput.trim().toLowerCase()
  )
  
  // 新規追加が必要かどうか（入力があり、完全一致がない場合）
  const canAddNew = activityInput.trim() && !exactMatch

  // 外部クリックでサジェストを閉じる & 選択を解除
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
      // タグと入力欄のエリア外をクリックしたら選択を解除
      if (activityAreaRef.current && !activityAreaRef.current.contains(event.target as Node)) {
        setSelectedActivity("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // アクティビティをタグから選択
  const handleTagClick = useCallback((activity: typeof customActivities[0]) => {
    setSelectedActivity(activity.id)
    setActivityInput("")
    setShowSuggestions(false)
  }, [])

  // サジェストから選択
  const handleSuggestionClick = useCallback((activity: typeof customActivities[0]) => {
    setSelectedActivity(activity.id)
    setActivityInput("")
    setShowSuggestions(false)
  }, [])

  // 選択をクリア
  const handleClearSelection = useCallback(() => {
    setSelectedActivity("")
    setActivityInput("")
    activityInputRef.current?.focus()
  }, [])

  const colorOptions = [
    { value: "bg-sumi", label: "墨色", color: "#5a5a5a" },
    { value: "bg-ai", label: "藍色", color: "#165e83" },
    { value: "bg-gin-nezu", label: "銀鼠", color: "#9fa0a0" },
    { value: "bg-seiji", label: "青磁色", color: "#7ebea5" },
    { value: "bg-usuzumi", label: "薄墨色", color: "#787878" },
    { value: "bg-hatoba", label: "鳩羽色", color: "#675f7c" },
    { value: "bg-fuji-nezu", label: "藤鼠", color: "#a6a5c4" },
    { value: "bg-aotake", label: "青竹色", color: "#7ebeab" },
    { value: "bg-susutake", label: "煤竹色", color: "#5b5248" },
    { value: "bg-rikyu-nezu", label: "利休鼠", color: "#6b7b6e" },
  ]

  // 行動追加
  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return

    const result = await addActivity({
      name: newActivityName.trim(),
      icon: null,
      color: newActivityColor, // 選択された色を使用
      goal_id: selectedGoal || null // 現在選択されている目標IDを紐付ける
    })

    if (result.success) {
      // 追加した行動を自動選択
      setSelectedActivity(result.data)

      // フォームをリセット
      setNewActivityName("")
      setNewActivityColor("bg-sumi")
      setHoveredColor(null)
      setShowAddForm(false)
    } else {
      // Toast通知ではなく、エラーステートに設定
      setOperationError(t('errors.activity_add_failed'))
    }
  }

  // 直接入力から新規アクティビティを追加
  const handleAddFromInput = async () => {
    if (!activityInput.trim()) return

    const result = await addActivity({
      name: activityInput.trim(),
      icon: null,
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)].value,
      goal_id: selectedGoal || null // 現在選択されている目標IDを紐付ける
    })

    if (result.success) {
      setSelectedActivity(result.data)
      setActivityInput("")
      setShowSuggestions(false)
    } else {
      setOperationError(t('errors.activity_add_failed'))
    }
  }

  // 目標追加ハンドラー
  const handleAddGoal = async () => {
    if (!validateGoalForm()) return

    setIsSubmittingGoal(true)
    try {
      const goalData: DbGoalFormData = {
        title: goalFormData.title,
        motivation: JSON.stringify(dontDoTags),
        deadline: goalFormData.deadline,
        weekdayHours: parseInt(goalFormData.weekdayHours),
        weekendHours: parseInt(goalFormData.weekendHours),
        calculatedHours: goalFormData.calculatedHours
      }

      // 編集モードか新規追加モードか判定
      const result = editingGoalId 
        ? await updateGoal(editingGoalId, goalData)
        : await addGoal(goalData)
      
      if (result.success) {
        if (!editingGoalId && result.data) {
          // 新規追加の場合：追加した目標を選択状態に
          setSelectedGoal(result.data)
          sessionStorage.setItem('currentSelectedGoal', result.data)
        }
        // フォームを閉じてリセット
        setShowGoalForm(false)
        setEditingGoalId(null)
        resetGoalForm({})
        setDontDoTags([])
      }
    } catch (error) {
      setOperationError(editingGoalId ? t('goals.update_error') : t('errors.goal_add_failed'))
    } finally {
      setIsSubmittingGoal(false)
    }
  }

  // 目標フォームキャンセル
  const handleCancelGoalForm = () => {
    setShowGoalForm(false)
    setEditingGoalId(null)
    resetGoalForm({})
    setDontDoTags([])
  }

  // 目標編集ハンドラー
  const handleEditGoal = (goalId: string) => {
    const goal = activeGoals.find(g => g.id === goalId)
    if (!goal) return
    
    // フォームに目標データを設定
    const parsedDontList = goal.dont_list ? JSON.parse(goal.dont_list as string) : []
    setDontDoTags(Array.isArray(parsedDontList) ? parsedDontList : [])
    
    resetGoalForm({
      title: goal.title,
      deadline: goal.deadline || '',
      weekdayHours: String(goal.weekday_hours || 0),
      weekendHours: String(goal.weekend_hours || 0),
      calculatedHours: goal.target_duration || 0
    })
    
    setEditingGoalId(goalId)
    setShowGoalForm(true)
  }

  // 削除確認ダイアログを開く
  const handleOpenDeleteConfirm = (goalId: string) => {
    setGoalToDelete(goalId)
    setShowDeleteConfirm(true)
  }

  // 目標削除ハンドラー
  const handleDeleteGoal = async () => {
    if (!goalToDelete) return
    
    setIsDeletingGoal(true)
    try {
      const result = await deleteGoalFromDb(goalToDelete)
      
      if (result.success) {
        // 削除された目標が選択中の場合、別の目標を選択
        if (selectedGoal === goalToDelete) {
          const remainingGoals = activeGoals.filter(g => g.id !== goalToDelete)
          if (remainingGoals.length > 0) {
            setSelectedGoal(remainingGoals[0].id)
            sessionStorage.setItem('currentSelectedGoal', remainingGoals[0].id)
          } else {
            setSelectedGoal('')
            sessionStorage.removeItem('currentSelectedGoal')
          }
        }
        
        // ダイアログを閉じる
        setShowDeleteConfirm(false)
        setGoalToDelete(null)
      } else {
        setOperationError(t('goals.delete_error'))
      }
    } catch (error) {
      setOperationError(t('goals.delete_error'))
    } finally {
      setIsDeletingGoal(false)
    }
  }



  const handleStart = async () => {
    if (!selectedActivity) return

    setIsStarting(true)

    // 少し遅延を入れて開始感を演出
    await new Promise((resolve) => setTimeout(resolve, 500))

    const activity = customActivities.find((a) => a.id === selectedActivity)
    if (!activity) return

    const sessionData: SessionData = {
      activityId: selectedActivity,
      activityName: activity.name,
      startTime: new Date(),
      location: location || '',
      notes: '',
      activityColor: activity.color,
      activityIcon: activity.icon || undefined,
      goalId: selectedGoal || undefined,
    }

    // 目標が選択されている場合、目標情報を取得
    if (selectedGoal) {
      const selectedGoalData = activeGoals.find(goal => goal.id === selectedGoal)
      if (selectedGoalData) {
        // 平日・土日の目標時間を計算（分単位）
        const weekdayMinutes = (selectedGoalData.weekday_hours || 0) * 60
        const weekendMinutes = (selectedGoalData.weekend_hours || 0) * 60
        
        // 今日が平日か土日かで目標時間を決定
        const today = new Date()
        const isWeekend = today.getDay() === 0 || today.getDay() === 6
        sessionData.targetTime = isWeekend ? weekendMinutes : weekdayMinutes
      }
    }

    onStart(sessionData)
    setIsStarting(false)
  }

  const selectedActivityData = customActivities.find((a) => a.id === selectedActivity)

  return (
    <Card className="bg-transparent border-0 shadow-none group/card">
      <div className="rounded-xl border border-white/10 p-5 shadow-lg transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] relative overflow-hidden">
        {/* グローエフェクト用のオーバーレイ */}
        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent" />
        </div>

        {/* エラーモーダル */}
        <ErrorModal
          isOpen={!!operationError}
          onClose={() => {
            // エラーステートをクリアしてモーダルを閉じる
            setOperationError(null)
          }}
          message={operationError || ''}
        />

        <CardHeader className="px-0 pt-0 pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center text-xl md:text-2xl font-bold">
            <span className="text-[#fffffC]">
               {t('session_start.title')}
            </span>
          </CardTitle>
          
          {/* 右側のボタン群 */}
          <div className="flex items-center gap-2.5">
            {activeGoals.length > 0 && (
              <Select 
                value={selectedGoal} 
                onValueChange={(value) => {
                  // 循環矢印を180度回転（累積）
                  setRotationDegree(prev => prev + 180)
                  // 目標を変更（keyが変わることでアニメーションがトリガーされる）
                  setSelectedGoal(value)
                }}
              >
                <SelectTrigger 
                  className="w-auto bg-[#0f1115]/80 hover:bg-[#0f1115] border-white/10 hover:border-white/20 text-gray-300 hover:text-white text-xs h-8 px-3.5 gap-2 rounded-xl transition-all duration-200 focus:ring-0 focus:ring-offset-0 backdrop-blur-sm shadow-sm"
                  icon={
                    <div style={{ perspective: '100px' }}>
                      <RefreshCw 
                        className="h-3.5 w-3.5 transition-transform duration-500 ease-in-out" 
                        style={{ 
                          transform: `rotateY(${rotationDegree}deg)`,
                          transformStyle: 'preserve-3d',
                          backfaceVisibility: 'visible'
                        }}
                      />
                    </div>
                  }
                  hideChevron={true}
                >
                  <span className="font-medium">{t('focus.change_goal')}</span>
                </SelectTrigger>
                <SelectContent className="bg-[#0f1115]/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
                  {activeGoals.map((goal) => (
                    <SelectItem 
                      key={goal.id} 
                      value={goal.id}
                      className="text-white hover:bg-white/5 text-xs focus:bg-emerald-500/10 focus:text-emerald-400"
                    >
                      {goal.title.length > 20 ? `${goal.title.substring(0, 20)}...` : goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowGoalForm(true)}
              className="h-8 px-3.5 text-xs bg-[#0f1115]/80 hover:bg-[#0f1115] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm shadow-sm font-medium"
            >
              {t('focus.add_goal')}
              <Plus className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 space-y-4 lg:space-y-4 relative z-10">
        {/* コンテンツ切り替えコンテナ */}
        <div style={{ perspective: "1200px" }}>
          <AnimatePresence mode="wait">
            {showGoalForm ? (
              <motion.div
                key="goal-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.2, 
                  ease: "easeInOut"
                }}
                className="rounded-xl border border-white/10 p-5 shadow-lg bg-gray-950"
              >
              <div className="space-y-2">
                <GoalTitleInput
                  value={goalFormData.title}
                  onChange={(value) => updateGoalField("title", value)}
                />

                <GoalDontDoSelector
                  selectedTags={dontDoTags}
                  onChange={setDontDoTags}
                />

                <GoalHoursInputs
                  deadline={goalFormData.deadline}
                  onDeadlineChange={(value) => updateGoalField("deadline", value)}
                  weekdayHours={goalFormData.weekdayHours}
                  weekendHours={goalFormData.weekendHours}
                  onWeekdayHoursChange={(value) => updateGoalField("weekdayHours", value)}
                  onWeekendHoursChange={(value) => updateGoalField("weekendHours", value)}
                  validationErrors={goalValidationErrors}
                />

                <div className="flex space-x-3 pt-1">
                  <Button
                    onClick={handleCancelGoalForm}
                    variant="outline"
                    className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white text-sm h-10"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleAddGoal}
                    disabled={goalFormData.title.trim() === "" || dontDoTags.length === 0 || isSubmittingGoal}
                    className="flex-1 bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmittingGoal ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      editingGoalId ? t('common.save') : t('goals.addGoal')
                    )}
                  </Button>
                </div>
              </div>
              </motion.div>
            ) : showAddForm ? (
              <motion.div
                key="activity-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.2, 
                  ease: "easeInOut"
                }}
                className="rounded-xl border border-white/10 p-5 shadow-lg bg-gray-950"
              >
            <div className="pb-3 mb-4 border-b border-white/5">
              <h3 className="text-white text-base font-semibold">{t('session_start.add_new_activity')}</h3>
            </div>
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-xs tracking-wider">{t('session_start.activity_name')}</Label>
                  <CharacterCounter current={newActivityName.length} max={limits.activityName} />
                </div>
                <Input
                  ref={activityNameInputRef}
                  placeholder={t('session_start.activity_name')}
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value.slice(0, limits.activityName))}
                  maxLength={limits.activityName}
                  className="bg-gray-900/50 border-gray-700 focus:border-emerald-700/50 focus:ring-emerald-700/20 text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-xs tracking-wider">{t('session_start.activity_color')}</Label>
                <div className="grid grid-cols-6 gap-3 relative bg-gray-900/30 p-3 rounded-lg border border-white/5">
                  {colorOptions.map((color) => (
                    <div key={color.value} className="relative flex justify-center">
                      <button
                        type="button"
                        onClick={() => setNewActivityColor(color.value)}
                        onMouseEnter={() => setHoveredColor(color.value)}
                        onMouseLeave={() => setHoveredColor(null)}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                          newActivityColor === color.value 
                            ? "border-white ring-2 ring-emerald-500 shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
                            : "border-transparent hover:border-white/50"
                        }`}
                        style={{ backgroundColor: color.color }}
                      />
                      {hoveredColor === color.value && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap z-10 border border-white/10">
                          {color.label}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 text-right">
                  選択中: <span className="text-white font-medium">{colorOptions.find(c => c.value === newActivityColor)?.label}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewActivityName("")
                    setNewActivityColor("bg-sumi")
                    setHoveredColor(null)
                  }}
                  variant="outline"
                  className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-white/5 hover:text-white text-sm h-10"
                >
                  {t('session_start.cancel')}
                </Button>
                <Button
                  onClick={handleAddActivity}
                  disabled={!newActivityName.trim()}
                  className="flex-1 bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {t('session_start.save')}
                </Button>
              </div>
            </div>
              </motion.div>
            ) : (
              <motion.div
                key={`main-content-${selectedGoal}`}
                initial={{ rotateY: -180 }}
                animate={{ 
                  rotateY: 0
                }}
                exit={{ rotateY: 180 }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeInOut"
                }}
                style={{
                  transformStyle: "preserve-3d",
                }}
                ref={activityAreaRef}
                className="relative"
              >
                {/* 表面 (コンテンツ) */}
                <div 
                  className="rounded-xl border border-white/10 p-5 shadow-lg bg-gray-950 hover:border-white/20 h-full"
                  style={{ backfaceVisibility: "hidden" }}
                >
            <div className="space-y-4">
              {/* CURRENT FOCUS セクション */}
              <div className="space-y-3">
                {/* 目標情報 */}
                <div className="flex items-center gap-4 py-2">
                  {/* 目標アイコン（常に同じ） */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                    <Target className="w-7 h-7 md:w-8 md:h-8 text-gray-300" />
                  </div>
                  
                  {/* 目標テキスト */}
                  <div className="flex-1 text-left min-w-0">
                    {activeGoals.length > 0 ? (
                      <p className="text-white font-bold text-lg md:text-xl truncate">
                        {activeGoals.find(g => g.id === selectedGoal)?.title || activeGoals[0]?.title}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-sm md:text-base">
                        {t('focus.no_goal_description')}
                      </p>
                    )}
                  </div>
                  
                  {/* 編集・削除ボタン（目標がある場合のみ） */}
                  {activeGoals.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditGoal(selectedGoal)
                        }}
                        className="h-8 w-8 border border-white/10 hover:border-white/20 hover:bg-transparent text-gray-400 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDeleteConfirm(selectedGoal)
                        }}
                        className="h-8 w-8 hover:bg-transparent text-gray-400 border border-white/10 hover:border-red-900 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 行動選択 - タグ + 直接入力 + サジェスト */}
              <div className="space-y-3">
                <Label className="text-gray-300 text-xs tracking-wider pl-1">{t('session_start.select_activity')}</Label>
                
                {/* 過去のアクティビティをタグとして表示（最初に配置） */}
                {customActivities.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {customActivities.slice(0, 8).map((activity) => {
                        const isSelected = selectedActivity === activity.id
                        const isHovered = hoveredTagId === activity.id
                        return (
                          <div
                            key={activity.id}
                            className="relative"
                            onMouseEnter={() => setHoveredTagId(activity.id)}
                            onMouseLeave={() => setHoveredTagId(null)}
                          >
                            {/* 削除ボタン（ホバー時のみ表示） */}
                            {isHovered && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // 選択中のものを削除した場合はクリア
                                  if (selectedActivity === activity.id) {
                                    setSelectedActivity("")
                                    setActivityInput("")
                                  }
                                  deleteActivity(activity.id)
                                }}
                                className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-lg scale-in"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleTagClick(activity)}
                              className={`group inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200 border ${
                                isSelected
                                  ? "bg-gray-900/40 border-emerald-700/50 shadow-[0_0_10px_rgba(4,120,87,0.1)]"
                                  : "bg-gray-900/40 border-gray-700 hover:border-gray-500"
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 ${activity.color} rounded-full flex-shrink-0 transition-transform group-hover:scale-110`} />
                              <span className={`text-xs font-medium truncate max-w-[100px] ${
                                isSelected ? "text-white" : "text-gray-300 group-hover:text-white"
                              }`}>
                                {activity.name}
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* 入力フィールド + 追加ボタン + サジェスト */}
                <div ref={inputContainerRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        ref={activityInputRef}
                        placeholder={t('session_start.activity_input_placeholder')}
                        value={activityInput}
                        onChange={(e) => {
                          setActivityInput(e.target.value.slice(0, limits.activityName))
                          setShowSuggestions(true)
                          // 入力が変わったら選択をクリア（完全一致の場合は選択維持）
                          const match = customActivities.find(
                            a => a.name.toLowerCase() === e.target.value.trim().toLowerCase()
                          )
                          if (match) {
                            setSelectedActivity(match.id)
                          } else {
                            setSelectedActivity("")
                          }
                        }}
                        onFocus={() => {
                          setIsFocused(true)
                          setShowSuggestions(true)
                          // 入力欄にフォーカスしたら選択を解除
                          setSelectedActivity("")
                        }}
                        onBlur={() => setIsFocused(false)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        onKeyDown={(e) => {
                          // IME変換中（日本語入力の確定時など）は無視
                          if (isComposing) return
                          if (e.key === 'Enter' && canAddNew) {
                            e.preventDefault()
                            handleAddFromInput()
                          }
                        }}
                        maxLength={limits.activityName}
                        className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-sm pr-10 h-11 transition-all focus:border-emerald-700/50 focus:ring-emerald-700/20"
                      />
                      {/* 選択済みクリアボタン */}
                      {selectedActivity && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-lg p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {/* 追加ボタン */}
                    <Button
                      type="button"
                      onClick={handleAddFromInput}
                      disabled={!canAddNew}
                      size="icon"
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed h-11 w-11 flex-shrink-0 rounded-lg transition-all"
                    >
                      <Plus className="w-5 h-5 text-gray-300" />
                    </Button>
                  </div>

                  {/* サジェストドロップダウン */}
                  {showSuggestions && activityInput && filteredActivities.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-gray-800/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto animate-scale-in origin-top">
                      {/* フィルタリングされた既存アクティビティ */}
                      {filteredActivities.map((activity) => (
                        <button
                          key={activity.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(activity)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0 ${
                            selectedActivity === activity.id ? "bg-emerald-700/10" : ""
                          }`}
                        >
                          <div className={`w-6 h-6 ${activity.color} rounded-full flex-shrink-0 shadow-sm`} />
                          <span className="text-white text-sm truncate flex-1">{activity.name}</span>
                          {selectedActivity === activity.id && (
                            <Check className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* オプション: 場所入力（アコーディオン） */}
              <div className="border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  className="flex items-center space-x-2 text-left group"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                    <Plus className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-all duration-200 ${showLocationInput ? 'rotate-45' : ''}`} />
                  </div>
                  <Label className="text-gray-400 text-xs tracking-wider cursor-pointer group-hover:text-gray-300 transition-colors">
                    {t('session_start.location')}
                  </Label>
                </button>

                {/* 場所入力フィールド（アコーディオンコンテンツ） */}
                {showLocationInput && (
                  <div className="mt-3 animate-fade-in-down space-y-2">
                    <div className="flex items-center justify-between">
                      <CharacterCounter current={location.length} max={limits.location} />
                    </div>
                    <Input
                      placeholder={t('session_start.location_placeholder')}
                      value={location}
                      onChange={(e) => setLocation(e.target.value.slice(0, limits.location))}
                      maxLength={limits.location}
                      className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-sm h-11 focus:border-emerald-700/50 focus:ring-emerald-700/20"
                    />
                  </div>
                )}
              </div>

              {/* 開始ボタン */}
              <div className="pt-2">
                {isSessionActive ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <span className="w-full inline-block cursor-not-allowed">
                          <Button
                            disabled
                            className="w-full bg-gray-800 border border-gray-700 py-6 text-base font-medium opacity-50 pointer-events-none rounded-xl"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {t('session_start.start_recording')}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{t('common.recording_in_progress')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={handleStart}
                    disabled={!selectedActivity || isStarting}
                    className={`w-full py-6 text-base font-bold tracking-wide rounded-xl transition-all duration-300 shadow-lg disabled:opacity-50 disabled:shadow-none ${
                      !selectedActivity || isStarting 
                        ? "bg-gray-800 text-gray-500" 
                        : "bg-emerald-700 text-white shadow-emerald-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                    }`}
                  >
                    {isStarting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {t('session_start.starting_recording')}
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        {t('session_start.start_recording')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
                </div>

                {/* 裏面 (背景のみ) */}
                <div 
                  className="absolute inset-0 rounded-xl border border-white/10 bg-gray-950 flex items-center justify-center shadow-lg"
                  style={{ 
                    transform: "rotateY(180deg)",
                    backfaceVisibility: "hidden"
                  }}
                >
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#0f1420] border-white/10 text-white max-w-md rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              {t('goals.delete_confirmation_title')}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-base pt-2">
              {t('goals.delete_confirmation')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false)
                setGoalToDelete(null)
              }}
              disabled={isDeletingGoal}
              className="bg-transparent border-white/20 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/30 transition-all"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={isDeletingGoal}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all"
            >
              {isDeletingGoal ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : null}
              {isDeletingGoal ? t('goals.deleting') : t('goals.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
