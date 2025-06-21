"use client"

import { useState } from "react"
import { Play, MapPin, Target } from "lucide-react"
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

  const handleStart = async () => {
    if (!selectedActivity) return

    setIsStarting(true)

    // 少し遅延を入れて開始感を演出
    await new Promise((resolve) => setTimeout(resolve, 500))

    const activity = PREDEFINED_ACTIVITIES.find((a) => a.id === selectedActivity)
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
    }

    onStart(sessionData)
    setIsStarting(false)
  }

  const selectedActivityData = PREDEFINED_ACTIVITIES.find((a) => a.id === selectedActivity)

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white mb-2">努力を記録する</CardTitle>
        <p className="text-gray-400">見えない努力に、確かな証人を</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* アクティビティ選択 */}
        <div className="space-y-2">
          <Label className="text-gray-300">アクティビティを選択</Label>
          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="何に取り組みますか？" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {PREDEFINED_ACTIVITIES.map((activity) => (
                <SelectItem key={activity.id} value={activity.id} className="text-white hover:bg-gray-700">
                  <div className="flex items-center space-x-2">
                    <span>{activity.icon}</span>
                    <span>{activity.name}</span>
                    <span className="ml-2 text-xs text-gray-400">({activity.category})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </CardContent>
    </Card>
  )
}
