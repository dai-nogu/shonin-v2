"use client"

import { useState } from "react"
import { Play, MapPin, Target, Plus, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SessionData, Activity } from "./time-tracker"

const PREDEFINED_ACTIVITIES: Activity[] = [
  { id: "1", name: "読書", category: "学習", icon: "📚", color: "bg-blue-500" },
  { id: "2", name: "プログラミング", category: "学習", icon: "💻", color: "bg-purple-500" },
  { id: "3", name: "運動", category: "健康", icon: "🏃", color: "bg-red-500" },
  { id: "4", name: "音楽練習", category: "趣味", icon: "🎵", color: "bg-yellow-500" },
  { id: "5", name: "英語学習", category: "学習", icon: "🌍", color: "bg-green-500" },
  { id: "6", name: "瞑想", category: "健康", icon: "🧘", color: "bg-indigo-500" },
]

interface ActivitySelectorProps {
  onStart: (session: SessionData) => void
}

export function ActivitySelector({ onStart }: ActivitySelectorProps) {
  const [selectedActivity, setSelectedActivity] = useState<string>("")
  const [location, setLocation] = useState("")
  const [targetHours, setTargetHours] = useState("")
  const [targetMinutes, setTargetMinutes] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  const [customActivities, setCustomActivities] = useState<Activity[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newActivityName, setNewActivityName] = useState("")
  const [newActivityCategory, setNewActivityCategory] = useState("")
  const [newActivityIcon, setNewActivityIcon] = useState("")
  const [newActivityColor, setNewActivityColor] = useState("bg-red-500")
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)

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



  // 全アクティビティ（定義済み + カスタム）
  const allActivities = [...PREDEFINED_ACTIVITIES, ...customActivities]

  // アクティビティ追加
  const handleAddActivity = () => {
    if (!newActivityName.trim()) return

    const newActivity: Activity = {
      id: `custom-${Date.now()}`,
      name: newActivityName.trim(),
      category: newActivityCategory.trim() || "その他",
      icon: newActivityIcon.trim() || "📝",
      color: newActivityColor // 選択された色を使用
    }

    const updatedActivities = [...customActivities, newActivity]
    setCustomActivities(updatedActivities)

    // フォームをリセット
    setNewActivityName("")
    setNewActivityCategory("")
    setNewActivityIcon("")
    setNewActivityColor("bg-red-500")
    setHoveredColor(null)
    setShowAddForm(false)
  }

  // アクティビティ削除
  const handleDeleteActivity = (activityId: string) => {
    const updatedActivities = customActivities.filter(a => a.id !== activityId)
    setCustomActivities(updatedActivities)
    
    // 削除されたアクティビティが選択されていた場合、選択を解除
    if (selectedActivity === activityId) {
      setSelectedActivity("")
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
      tags: [], // タグは終了時に設定
      location,
      targetTime: targetTimeInMinutes > 0 ? targetTimeInMinutes : undefined,
      notes: "",
      activityColor: activity.color,
      activityIcon: activity.icon,
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
                  <SelectItem key={activity.id} value={activity.id} className="text-white hover:bg-gray-700">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-2">
                        <span>{activity.icon}</span>
                        <span>{activity.name}</span>
                        <span className="ml-2 text-xs text-gray-400">({activity.category})</span>
                      </div>
                      {activity.id.startsWith('custom-') && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteActivity(activity.id)
                          }}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
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
                    setNewActivityCategory("")
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
                    {selectedActivityData.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{selectedActivityData.name}</h3>
                    <p className="text-gray-300 text-sm">{selectedActivityData.category}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 場所設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                場所（オプション）
              </Label>
              <Input
                placeholder="どこで取り組みますか？"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* 目標時間設定 */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                目標時間（オプション）
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
