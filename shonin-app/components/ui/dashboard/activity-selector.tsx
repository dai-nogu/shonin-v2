"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { ErrorModal } from "@/components/ui/common/error-modal"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Play, X, Check } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useSessions } from "@/contexts/sessions-context"
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { getInputLimits } from "@/lib/input-limits"
import type { Activity, SessionData } from "./time-tracker"

interface ActivitySelectorProps {
  onStart: (session: SessionData) => void
}

export function ActivitySelector({ onStart }: ActivitySelectorProps) {
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const limits = getInputLimits(locale)
  const [selectedActivity, setSelectedActivity] = useState<string>("")
  const [location, setLocation] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  // 目標データを取得
  const { goals } = useGoalsDb()
  
  // セッション状態を取得
  const { isSessionActive } = useSessions()

  // sessionStorageから追加された目標を自動選択
  useEffect(() => {
    const goalIdFromStorage = sessionStorage.getItem('selectedGoalFromAdd')
    if (goalIdFromStorage) {
      setSelectedGoal(goalIdFromStorage)
      // 読み取り後すぐに削除
      sessionStorage.removeItem('selectedGoalFromAdd')
    }
  }, [])
  
  // 目標を選択肢として利用可能な形式に変換
  const availableGoals = goals.map(goal => ({
    id: goal.id,
    title: goal.title,
    deadline: goal.deadline,
    description: goal.description,
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
  
  const { activities: customActivities, loading: activitiesLoading, addActivity, deleteActivity } = useActivities()
  const [hoveredTagId, setHoveredTagId] = useState<string | null>(null) // ホバー中のタグID
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityColor, setNewActivityColor] = useState("bg-red-500")
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  
  // 直接入力用の状態
  const [activityInput, setActivityInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isComposing, setIsComposing] = useState(false) // IME変換中フラグ
  const inputContainerRef = useRef<HTMLDivElement>(null)
  
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

  // 外部クリックでサジェストを閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // アクティビティをタグから選択
  const handleTagClick = useCallback((activity: typeof customActivities[0]) => {
    setSelectedActivity(activity.id)
    setActivityInput(activity.name)
    setShowSuggestions(false)
  }, [])

  // サジェストから選択
  const handleSuggestionClick = useCallback((activity: typeof customActivities[0]) => {
    setSelectedActivity(activity.id)
    setActivityInput(activity.name)
    setShowSuggestions(false)
  }, [])

  // 選択をクリア
  const handleClearSelection = useCallback(() => {
    setSelectedActivity("")
    setActivityInput("")
    activityInputRef.current?.focus()
  }, [])

  const colorOptions = [
    { value: "bg-red-500", label: "レッド", color: "#ef4444" },
    { value: "bg-blue-500", label: "ブルー", color: "#3b82f6" },
    { value: "bg-yellow-500", label: "イエロー", color: "#eab308" },
    { value: "bg-green-500", label: "グリーン", color: "#22c55e" },
    { value: "bg-purple-500", label: "パープル", color: "#8b5cf6" },
    { value: "bg-orange-500", label: "オレンジ", color: "#f97316" },
    { value: "bg-pink-500", label: "ピンク", color: "#ec4899" },
    { value: "bg-teal-500", label: "ライトブルー", color: "#91f0ff" },
    { value: "bg-emerald-500", label: "エメラルド", color: "#10b981" },
    { value: "bg-cyan-500", label: "ブラウン", color: "#d0430b" },
    { value: "bg-indigo-500", label: "インディゴ", color: "#6366f1" },
    { value: "bg-gray-500", label: "グレー", color: "#6b7280" },
  ]

  // 全行動（カスタムのみ）
  const allActivities = customActivities

  // 行動追加
  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return

    const result = await addActivity({
      name: newActivityName.trim(),
      icon: null,
      color: newActivityColor // 選択された色を使用
    })

    if (result.success) {
      // 追加した行動を自動選択
      setSelectedActivity(result.data)
      setActivityInput(newActivityName.trim())

      // フォームをリセット
      setNewActivityName("")
      setNewActivityColor("bg-red-500")
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
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)].value
    })

    if (result.success) {
      setSelectedActivity(result.data)
      setShowSuggestions(false)
    } else {
      setOperationError(t('errors.activity_add_failed'))
    }
  }



  const handleStart = async () => {
    if (!selectedActivity) return

    setIsStarting(true)

    // 少し遅延を入れて開始感を演出
    await new Promise((resolve) => setTimeout(resolve, 500))

    const activity = allActivities.find((a) => a.id === selectedActivity)
    if (!activity) return

    const sessionData: SessionData = {
      activityId: selectedActivity,
      activityName: activity.name,
      startTime: new Date(),
      location: location || '',
      notes: '',
      activityColor: activity.color,
      activityIcon: activity.icon || undefined,
      goalId: selectedGoal === "none" ? undefined : selectedGoal,
    }

    // 目標が選択されている場合、目標情報を取得
    if (selectedGoal && selectedGoal !== "none") {
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

  const selectedActivityData = allActivities.find((a) => a.id === selectedActivity)

  return (
    <Card className="bg-transparent border-0 shadow-none">
      {/* エラーモーダル */}
      <ErrorModal
        isOpen={!!operationError}
        onClose={() => {
          // エラーステートをクリアしてモーダルを閉じる
          setOperationError(null)
        }}
        message={operationError || ''}
      />

      <CardHeader className="px-0 pt-0 pb-4">
        <CardTitle className="text-white flex items-center text-xl md:text-2xl font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
             {t('session_start.title')}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 space-y-4 lg:space-y-6">
        {/* 新しい行動追加フォーム */}
        {showAddForm && (
          <div className="rounded-xl border border-white/10 bg-card/30 backdrop-blur-xl p-5 shadow-lg animate-fade-in-down">
            <div className="pb-3 mb-4 border-b border-white/5">
              <h3 className="text-white text-base font-semibold">{t('session_start.add_new_activity')}</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-xs uppercase tracking-wider">{t('session_start.activity_name')}</Label>
                  <CharacterCounter current={newActivityName.length} max={limits.activityName} />
                </div>
                <Input
                  ref={activityNameInputRef}
                  placeholder={t('session_start.activity_name')}
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value.slice(0, limits.activityName))}
                  maxLength={limits.activityName}
                  className="bg-gray-900/50 border-gray-700 focus:border-green-500/50 focus:ring-green-500/20 text-white placeholder-gray-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-xs uppercase tracking-wider">{t('session_start.activity_color')}</Label>
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
                            ? "border-white ring-2 ring-green-400 shadow-[0_0_10px_rgba(255,255,255,0.3)]" 
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
                    setNewActivityColor("bg-red-500")
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
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 h-10"
                >
                  {t('session_start.save')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* フォーム表示時以外の通常の内容 */}
        {!showAddForm && (
          <div className="rounded-xl border border-white/10 bg-card/30 backdrop-blur-xl p-5 shadow-lg transition-all duration-300 hover:border-white/20">
            <div className="space-y-6">
              {/* 目標選択 */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-xs uppercase tracking-wider pl-1">
                  {t('session_start.select_goal')}
                </Label>
                <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white focus:ring-green-500/20 focus:border-green-500/50 h-11">
                    <SelectValue placeholder={t('session_start.goal_placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 backdrop-blur-xl">
                    <SelectItem value="none" className="text-gray-400 hover:bg-gray-700 py-2 cursor-pointer focus:bg-gray-700">
                      {t('session_start.no_goal')}
                    </SelectItem>
                    {activeGoals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id} className="text-white hover:bg-gray-700 py-2 cursor-pointer focus:bg-gray-700">
                        <span className="text-sm font-medium">{goal.title}</span>
                      </SelectItem>
                    ))}
                    
                    {/* 目標設定へのリンク */}
                    <div className="p-2 border-t border-gray-600/50 mt-1">
                      <Button
                        onClick={() => router.push(`/${locale}/goals/add?from=dashboard`)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/10 h-9"
                      >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        {t('goals.addGoal')}
                      </Button>
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {/* 行動選択 - 直接入力 + サジェスト + タグ */}
              <div className="space-y-3">
                <Label className="text-gray-300 text-xs uppercase tracking-wider pl-1">{t('session_start.select_activity')}</Label>
                
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
                        className={`bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-sm pr-10 h-11 transition-all ${
                          selectedActivity ? "border-green-500/50 shadow-[0_0_0_1px_rgba(34,197,94,0.2)]" : "focus:border-green-500/50 focus:ring-green-500/20"
                        }`}
                      />
                      {/* 選択済みクリアボタン */}
                      {selectedActivity && (
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full p-0.5"
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
                            selectedActivity === activity.id ? "bg-green-500/10" : ""
                          }`}
                        >
                          <div className={`w-6 h-6 ${activity.color} rounded-full flex-shrink-0 shadow-sm`} />
                          <span className="text-white text-sm truncate flex-1">{activity.name}</span>
                          {selectedActivity === activity.id && (
                            <Check className="w-4 h-4 text-green-400 ml-auto flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 過去のアクティビティをタグとして表示 */}
                {allActivities.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {allActivities.slice(0, 8).map((activity) => {
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
                                className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-gray-700 hover:bg-red-500/80 text-gray-300 hover:text-white rounded-full flex items-center justify-center transition-all shadow-lg scale-in"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleTagClick(activity)}
                              className={`group inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm transition-all duration-200 border ${
                                isSelected
                                  ? "bg-green-500/10 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                                  : "bg-gray-900/40 border-gray-700 hover:border-gray-500 hover:bg-gray-800"
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 ${activity.color} rounded-full flex-shrink-0 transition-transform group-hover:scale-110`} />
                              <span className={`text-xs font-medium truncate max-w-[100px] ${
                                isSelected ? "text-green-100" : "text-gray-300 group-hover:text-white"
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
              </div>

              {/* 場所設定 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300 text-xs uppercase tracking-wider pl-1">
                    {t('session_start.location')}
                  </Label>
                  <CharacterCounter current={location.length} max={limits.location} />
                </div>
                <Input
                  placeholder={t('session_start.location_placeholder')}
                  value={location}
                  onChange={(e) => setLocation(e.target.value.slice(0, limits.location))}
                  maxLength={limits.location}
                  className="bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 text-sm h-11 focus:border-green-500/50 focus:ring-green-500/20"
                />
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
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-green-900/30 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0"
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
        )}
      </CardContent>
    </Card>
  )
}
