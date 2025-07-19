"use client"

import { useState, useRef, useEffect } from "react"
import { Play, MapPin, Target, Plus, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SessionData } from "./time-tracker"
import { useActivities, type Activity } from "@/contexts/activities-context"
import { useGoalsDb } from "@/hooks/use-goals-db"

interface ActivitySelectorProps {
  onStart: (session: SessionData) => void
  onGoalSettingClick?: () => void
}

export function ActivitySelector({ onStart, onGoalSettingClick }: ActivitySelectorProps) {
  const [selectedActivity, setSelectedActivity] = useState<string>("")
  const [location, setLocation] = useState("")
  const [targetHours, setTargetHours] = useState("")
  const [targetMinutes, setTargetMinutes] = useState("")
  const [selectedGoal, setSelectedGoal] = useState("")
  const [isStarting, setIsStarting] = useState(false)

  // 今日が平日かどうかを判定
  const isWeekday = () => {
    const today = new Date().getDay() // 0=日曜, 1=月曜, ..., 6=土曜
    return today >= 1 && today <= 5 // 月曜〜金曜
  }

  // 目標選択時に目標時間を自動設定
  const handleGoalSelection = (goalId: string) => {
    setSelectedGoal(goalId)
    
    if (goalId && goalId !== "none") {
      const selectedGoalData = availableGoals.find(goal => goal.id === goalId)
      if (selectedGoalData) {
        const targetHours = isWeekday() ? selectedGoalData.weekday_hours : selectedGoalData.weekend_hours
        setTargetHours((targetHours || 0).toString())
        setTargetMinutes("0") // 分はデフォルトで0
      }
    }
  }

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
  const [newActivityIcon, setNewActivityIcon] = useState("")
  const [newActivityColor, setNewActivityColor] = useState("bg-red-500")
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  
  // アクティビティ名入力フィールドのref
  const activityNameInputRef = useRef<HTMLInputElement>(null)

  // フォームが開いた時にアクティビティ名フィールドにフォーカス
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

  // 全アクティビティ（カスタムのみ）
  const allActivities = customActivities

  // アクティビティ追加
  const handleAddActivity = async () => {
    if (!newActivityName.trim()) return

    const activityId = await addActivity({
      name: newActivityName.trim(),
      icon: newActivityIcon.trim() || null,
      color: newActivityColor // 選択された色を使用
    })

    if (activityId) {
      // 追加したアクティビティを自動選択
      setSelectedActivity(activityId)

      // フォームをリセット
      setNewActivityName("")
      setNewActivityIcon("")
      setNewActivityColor("bg-red-500")
      setHoveredColor(null)
      setShowAddForm(false)
    } else {
      alert("アクティビティの追加に失敗しました。")
    }
  }



  const handleStart = async () => {
    if (!selectedActivity) return

    setIsStarting(true)

    // 少し遅延を入れて開始感を演出
    await new Promise((resolve) => setTimeout(resolve, 500))

    const activity = allActivities.find((a) => a.id === selectedActivity)
    if (!activity) return

    // 目標時間を分に変換
    const targetTimeInMinutes = 
      (parseInt(targetHours) || 0) * 60 + (parseInt(targetMinutes) || 0)

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
        const weekdayMinutes = selectedGoalData.weekday_hours * 60
        const weekendMinutes = selectedGoalData.weekend_hours * 60
        
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
      <CardHeader className="pb-4">
        <CardTitle className="text-white flex items-center text-lg lg:text-xl">
          努力を記録する
        </CardTitle>
        <p className="text-gray-400 text-sm">見えない努力を、確かな記録へ</p>
      </CardHeader>

      <CardContent className="space-y-4 lg:space-y-6">
        {/* 新しいアクティビティ追加フォーム */}
        {showAddForm && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">新しいアクティビティを追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">名前</Label>
                <Input
                  ref={activityNameInputRef}
                  placeholder="アクティビティ名"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">アイコン</Label>
                <Input
                  placeholder="📚"
                  value={newActivityIcon}
                  onChange={(e) => setNewActivityIcon(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  maxLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">色</Label>
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
                  onClick={handleAddActivity}
                  disabled={!newActivityName.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
                >
                  追加
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewActivityName("")
                    setNewActivityIcon("")
                    setNewActivityColor("bg-red-500")
                    setHoveredColor(null)
                  }}
                  variant="outline"
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 text-sm"
                >
                  キャンセル
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* フォーム表示時以外の通常の内容 */}
        {!showAddForm && (
          <>
            {/* アクティビティ選択 */}
            <div className="space-y-2">
              <Label className="text-gray-300">アクティビティを選択</Label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="何に取り組みますか？" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {allActivities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id} className="text-white hover:bg-gray-700 py-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 ${activity.color} rounded-full flex items-center justify-center text-sm`}>
                          {activity.icon}
                        </div>
                        <span className="text-base">{activity.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* 新しいアクティビティを追加ボタン */}
                  <div className="p-2 border-t border-gray-600">
                    <Button
                      onClick={() => setShowAddForm(true)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/20"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新しいアクティビティを追加
                    </Button>
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* 選択されたアクティビティのプレビュー */}
            {selectedActivityData && (
              <div className={`p-3 lg:p-4 rounded-lg ${selectedActivityData.color} bg-opacity-20 border border-opacity-30`}>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 lg:w-12 lg:h-12 ${selectedActivityData.color} rounded-full flex items-center justify-center text-lg lg:text-2xl`}
                  >
                    {selectedActivityData.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm lg:text-base">{selectedActivityData.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* 場所設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                場所
              </Label>
              <Input
                placeholder="どこで取り組みますか？"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* 目標選択 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center text-sm">
                <Target className="w-4 h-4 mr-2" />
                目標を選択
              </Label>
              <Select value={selectedGoal} onValueChange={handleGoalSelection}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="目標を選択してください（任意）" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none" className="text-gray-400 hover:bg-gray-700 py-2">
                    目標を選択しない
                  </SelectItem>
                  {activeGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id} className="text-white hover:bg-gray-700 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{goal.title}</span>
                        <span className="text-xs text-gray-400">
                          平日: {goal.weekday_hours}時間 / 土日: {goal.weekend_hours}時間
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* 目標設定へのリンク */}
                  {activeGoals.length === 0 && (
                    <div className="p-2">
                      <Button
                        onClick={onGoalSettingClick}
                        variant="ghost"
                        size="sm"
                        className="w-full text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        目標を設定する
                      </Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 目標時間設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2" />
                目標時間
              </Label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={targetHours}
                    onChange={(e) => setTargetHours(e.target.value)}
                    min="0"
                    max="23"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-16 lg:w-20 text-center"
                  />
                  <span className="text-gray-300 text-sm">時間</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={targetMinutes}
                    onChange={(e) => setTargetMinutes(e.target.value)}
                    min="0"
                    max="59"
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-16 lg:w-20 text-center"
                  />
                  <span className="text-gray-300 text-sm">分</span>
                </div>
              </div>
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
                  記録開始中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  記録開始
                </>
              )}
            </Button>

            <p className="text-gray-400 text-xs text-center">
              *停止するまでは、ずっと記録されています。
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
