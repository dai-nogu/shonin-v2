"use client"

import { useState } from "react"
import { Clock, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Badge } from "@/components/ui/common/badge"
import { ConfirmStartModal } from "./confirm-start-modal"
import type { SessionData } from "./time-tracker"

interface RecentActivity {
  id: string
  name: string
  duration: string
  date: string
  rating: number
  category: string
  icon: string
  color: string
}

interface RecentActivitiesProps {
  onStartActivity?: (sessionData: SessionData) => void
}

export function RecentActivities({ onStartActivity }: RecentActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null)
  const [showModal, setShowModal] = useState(false)

  const activities: RecentActivity[] = [
    {
      id: "1",
      name: "読書",
      duration: "1h 30m",
      date: "今日",
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
      rating: 4,
      category: "健康",
      icon: "🏃",
      color: "bg-red-500",
    },
  ]

  const handleActivityClick = (activity: RecentActivity) => {
    setSelectedActivity(activity)
    setShowModal(true)
  }

  const handleConfirmStart = () => {
    if (selectedActivity && onStartActivity) {
      const sessionData: SessionData = {
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        startTime: new Date(),
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
            <Clock className="w-5 h-5 mr-2" />
            最近のアクティビティ
          </CardTitle>
          <p className="text-gray-400 text-sm">クリックして同じアクティビティを開始</p>
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
                <div className="flex items-center space-x-2 mb-2">
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
      />
    </>
  )
}
