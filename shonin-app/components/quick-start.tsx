"use client"

import { useState } from "react"
import { Zap, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmStartModal } from "./confirm-start-modal"
import type { SessionData } from "./time-tracker"

interface QuickStartActivity {
  id: string
  name: string
  duration: string
  date: string
  tags: string[]
  rating: number
  category: string
  icon: string
  color: string
}

interface QuickStartProps {
  onStartActivity?: (sessionData: SessionData) => void
}

export function QuickStart({ onStartActivity }: QuickStartProps) {
  const [selectedActivity, setSelectedActivity] = useState<QuickStartActivity | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activities: QuickStartActivity[] = [
    {
      id: "1",
      name: "読書",
      duration: "1h 30m",
      date: "今日",
      tags: ["自己啓発", "集中"],
      rating: 4,
      category: "学習",
      icon: "📚",
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "プログラミング",
      duration: "2h 15m",
      date: "昨日",
      tags: ["React", "学習"],
      rating: 5,
      category: "学習",
      icon: "💻",
      color: "bg-purple-500",
    },
    {
      id: "3",
      name: "運動",
      duration: "45m",
      date: "昨日",
      tags: ["筋トレ", "健康"],
      rating: 4,
      category: "健康",
      icon: "🏃",
      color: "bg-red-500",
    },
  ]

  const handleActivityClick = (activity: QuickStartActivity) => {
    setSelectedActivity(activity)
    setShowModal(true)
  }

  const handleConfirmStart = () => {
    if (selectedActivity && onStartActivity) {
      const sessionData: SessionData = {
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        startTime: new Date(),
        tags: [], // タグは終了時に設定
        location: "",
        notes: "",
      }
      onStartActivity(sessionData)
    }
    setShowModal(false)
    setSelectedActivity(null)
  }

  const handleCancel = () => {
    setShowModal(false)
    setSelectedActivity(null)
  }

  return (
    <>
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            クイックスタート
          </CardTitle>
          <p className="text-gray-400 text-sm">最近のアクティビティから素早く開始</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={index}
              onClick={() => handleActivityClick(activity)}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-sm`}>
                    {activity.icon}
                  </div>
                  <h3 className="text-white font-medium group-hover:text-green-400 transition-colors">
                    {activity.name}
                  </h3>
                  <span className="text-green-400 font-mono">{activity.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">📅 {activity.date}</span>
                </div>
              </div>
              <div className="flex items-center ml-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < activity.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                  />
                ))}
                <span className="text-gray-400 text-sm ml-2">気分</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmStartModal
        isOpen={showModal}
        activity={selectedActivity}
        onConfirm={handleConfirmStart}
        onCancel={handleCancel}
        showTags={false} // タグ表示を無効化
      />
    </>
  )
}
