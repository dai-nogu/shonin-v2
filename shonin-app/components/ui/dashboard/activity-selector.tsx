"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { Label } from "@/components/ui/common/label"
import { Textarea } from "@/components/ui/common/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/common/select"
import { ErrorModal } from "@/components/ui/common/error-modal"
import { CharacterCounter } from "@/components/ui/common/character-counter"
import { Plus, Play } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useToast } from "@/contexts/toast-context"
import { useTranslations, useLocale } from 'next-intl'
import { getInputLimits } from "@/lib/input-limits"
import type { Activity, SessionData } from "./time-tracker"

interface ActivitySelectorProps {
  onStart: (session: SessionData) => void
  onGoalSettingClick?: () => void
}

export function ActivitySelector({ onStart, onGoalSettingClick }: ActivitySelectorProps) {
  const t = useTranslations()
  const locale = useLocale()
  const limits = getInputLimits(locale)
  const [selectedActivity, setSelectedActivity] = useState<string>("")
  const [location, setLocation] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  // 目標データを取得
  const { goals } = useGoalsDb()
  
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
  
  const { activities: customActivities, loading: activitiesLoading, addActivity } = useActivities()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityColor, setNewActivityColor] = useState("bg-red-500")
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  
  // 行動名入力フィールドのref
  const activityNameInputRef = useRef<HTMLInputElement>(null)

  // フォームが開いた時に行動名フィールドにフォーカス
  useEffect(() => {
    if (showAddForm && activityNameInputRef.current) {
      activityNameInputRef.current.focus()
    }
  }, [showAddForm])

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
    <Card className="bg-gray-900 border-gray-800">
      {/* エラーモーダル */}
      <ErrorModal
        isOpen={!!operationError}
        onClose={() => {
          // エラーステートをクリアしてモーダルを閉じる
          setOperationError(null)
        }}
        message={operationError || ''}
      />

      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center text-[1.25rem] md:text-2xl">
          {t('session_start.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 lg:space-y-6">
        {/* 新しい行動追加フォーム */}
        {showAddForm && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">{t('session_start.add_new_activity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">{t('session_start.activity_name')}</Label>
                  <CharacterCounter current={newActivityName.length} max={limits.activityName} />
                </div>
                <Input
                  ref={activityNameInputRef}
                  placeholder={t('session_start.activity_name')}
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value.slice(0, limits.activityName))}
                  maxLength={limits.activityName}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">{t('session_start.activity_color')}</Label>
                <div className="grid grid-cols-6 gap-2 relative">
                  {colorOptions.map((color) => (
                    <div key={color.value} className="relative">
                      <button
                        type="button"
                        onClick={() => setNewActivityColor(color.value)}
                        onMouseEnter={() => setHoveredColor(color.value)}
                        onMouseLeave={() => setHoveredColor(null)}
                        className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 transition-all ${
                          newActivityColor === color.value 
                            ? "border-white ring-2 ring-green-400" 
                            : "border-gray-600 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.color }}
                      />
                      {hoveredColor === color.value && (
                        <div className="absolute bottom-10 lg:bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
                          {color.label}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  選択中: {colorOptions.find(c => c.value === newActivityColor)?.label}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewActivityName("")
                    setNewActivityColor("bg-red-500")
                    setHoveredColor(null)
                  }}
                  variant="outline"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 text-sm"
                >
                  {t('session_start.cancel')}
                </Button>
                <Button
                  onClick={handleAddActivity}
                  disabled={!newActivityName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                >
                  {t('session_start.save')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* フォーム表示時以外の通常の内容 */}
        {!showAddForm && (
          <>
            {/* 目標選択 */}
            <div className="space-y-2">
              <Label className="text-white text-sm">
                {t('session_start.select_goal')}
              </Label>
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white data-[placeholder]:text-gray-400">
                  <SelectValue placeholder={t('session_start.goal_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none" className="text-gray-400 hover:bg-gray-700 py-2">
                    {t('session_start.no_goal')}
                  </SelectItem>
                  {activeGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id} className="text-white hover:bg-gray-700 py-2">
                      <span className="text-sm font-medium">{goal.title}</span>
                    </SelectItem>
                  ))}
                  
                  {/* 目標設定へのリンク */}
                  <div className="p-2 border-t border-gray-600">
                    <Button
                      onClick={onGoalSettingClick}
                      variant="ghost"
                      size="sm"
                      className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('goals.addGoal')}
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 行動選択 */}
            <div className="space-y-2">
              <Label className="text-white">{t('session_start.select_activity')}</Label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white data-[placeholder]:text-gray-400">
                  <SelectValue placeholder={t('session_start.activity_placeholder')} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {allActivities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id} className="text-white hover:bg-gray-700 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 ${activity.color} rounded-full`}></div>
                        <span className="text-base">{activity.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* 新しい行動を追加ボタン */}
                  <div className="p-2 border-t border-gray-600">
                    <Button
                      onClick={() => setShowAddForm(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('session_start.add_new_activity')}
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 選択された行動のプレビュー */}
            {selectedActivityData && (
              <div className="mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 ${selectedActivityData.color} rounded-full`}></div>
                  <div>
                    <h3 className="text-white font-semibold text-sm lg:text-base">{selectedActivityData.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* 場所設定 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white text-sm">
                  {t('session_start.location')}
                </Label>
                <CharacterCounter current={location.length} max={limits.location} />
              </div>
              <Input
                placeholder={t('session_start.location_placeholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value.slice(0, limits.location))}
                maxLength={limits.location}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-sm"
              />
            </div>

            {/* 開始ボタン */}
            <Button
              onClick={handleStart}
              disabled={!selectedActivity || isStarting}
              className="w-full bg-green-600 hover:bg-green-700 py-3 text-base font-medium"
            >
              {isStarting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('session_start.starting_recording')}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('session_start.start_recording')}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
