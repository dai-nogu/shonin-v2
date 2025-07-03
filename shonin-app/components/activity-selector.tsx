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
        const targetHours = isWeekday() ? selectedGoalData.weekdayHours : selectedGoalData.weekendHours
        setTargetHours(targetHours.toString())
        setTargetMinutes("0") // 分はデフォルトで0
      }
    } else {
      // 「紐付けしない」が選択された場合は目標時間をクリア
      setTargetHours("")
      setTargetMinutes("")
    }
  }

  // 目標データ（実際は目標管理から取得）
  const availableGoals: Array<{
    id: string;
    title: string;
    targetValue: number;
    weekdayHours: number;
    weekendHours: number;
  }> = [
    // 実際の実装では getActiveGoals() から取得
  ]
  const { activities: customActivities, addActivity } = useActivities()
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
  const handleAddActivity = () => {
    if (!newActivityName.trim()) return

    const activityId = addActivity({
      name: newActivityName.trim(),
      category: "",
      icon: newActivityIcon.trim(),
      color: newActivityColor // 選択された色を使用
    })

    // 追加したアクティビティを自動選択
    setSelectedActivity(activityId)

    // フォームをリセット
    setNewActivityName("")
    setNewActivityIcon("")
    setNewActivityColor("bg-red-500")
    setHoveredColor(null)
    setShowAddForm(false)
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
      location,
      targetTime: targetTimeInMinutes > 0 ? targetTimeInMinutes : undefined,
      notes: "",
      activityColor: activity.color,
      activityIcon: activity.icon,
      goalId: selectedGoal && selectedGoal !== "none" ? selectedGoal : undefined,
    }

    onStart(sessionData)
    setIsStarting(false)
  }

  const selectedActivityData = allActivities.find((a) => a.id === selectedActivity)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white mb-2">努力を記録する</CardTitle>
        <p className="text-gray-400">見えない努力に、確かな証人を</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* アクティビティ選択 - フォーム表示時は隠す */}
        {!showAddForm && (
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
                      {activity.icon ? (
                        <span className="text-lg">{activity.icon}</span>
                      ) : (
                        <div className={`w-5 h-5 rounded-full ${activity.color}`}></div>
                      )}
                      <span className="text-base">{activity.name}</span>
                    </div>
                  </SelectItem>
                ))}
                
                {/* アクティビティ追加ボタン */}
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
        )}

        {/* アクティビティ追加フォーム */}
        {showAddForm && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg">新しいアクティビティを追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">アクティビティ名 *</Label>
                <Input
                  ref={activityNameInputRef}
                  placeholder="例: 日記を書く"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">アイコン（絵文字）</Label>
                <Input
                  placeholder="例: ✍️"
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
                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                          newActivityColor === color.value 
                            ? "border-white ring-2 ring-green-400" 
                            : "border-gray-600 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: color.color }}
                      />
                      {hoveredColor === color.value && (
                        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-10">
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
                  className="flex-1 bg-green-600 hover:bg-green-700"
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
                  className="flex-1 bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
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
            {/* 選択されたアクティビティのプレビュー */}
            {selectedActivityData && (
              <div className={`p-4 rounded-lg ${selectedActivityData.color} bg-opacity-20 border border-opacity-30`}>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 ${selectedActivityData.color} rounded-full flex items-center justify-center text-2xl`}
                  >
                    {selectedActivityData.icon || null}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedActivityData.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* 場所設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center">
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

            {/* 目標との紐付け */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                目標と紐付け
              </Label>
              {availableGoals.length > 0 ? (
                <>
                  <Select value={selectedGoal} onValueChange={handleGoalSelection}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="目標を選択" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="none" className="text-white hover:bg-gray-700">
                        紐付けしない
                      </SelectItem>
                      {availableGoals.map((goal) => (
                        <SelectItem key={goal.id} value={goal.id} className="text-white hover:bg-gray-700">
                          <div className="flex items-center justify-between w-full">
                            <span>{goal.title}</span>
                            <span className="text-xs text-gray-400 ml-2">目標: {goal.targetValue}時間</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGoal && selectedGoal !== "none" && (
                    <div className="text-sm text-green-400">
                      この活動が選択した目標の進捗に反映されます
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300 text-sm">まだ目標が設定されていません</p>
                      <p className="text-gray-400 text-xs mt-1">目標を設定すると進捗を自動で追跡できます</p>
                    </div>
                    <Button
                      onClick={onGoalSettingClick}
                      variant="outline"
                      size="sm"
                      className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      目標を設定
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 目標時間設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center">
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
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-20 text-center"
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
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 w-20 text-center"
                  />
                  <span className="text-gray-300 text-sm">分</span>
                </div>
              </div>
              {(targetHours || targetMinutes) && (
                <div className="text-sm text-green-400 mt-1">
                  目標: {targetHours || "0"}時間{targetMinutes || "0"}分
                  {selectedGoal && selectedGoal !== "none" && (
                    <span className="text-xs text-gray-400 ml-2">
                      ({isWeekday() ? "平日" : "土日"}の目標時間から自動設定)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 開始ボタン */}
            <Button
              onClick={handleStart}
              disabled={!selectedActivity || isStarting}
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 text-lg disabled:opacity-50"
            >
              {isStarting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>開始中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5" />
                  <span>記録開始</span>
                </div>
              )}
            </Button>

            {/* 励ましメッセージ */}
            <div className="text-center text-gray-400 text-sm italic">"誰も見ていなくても、私たちは見ています"</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
