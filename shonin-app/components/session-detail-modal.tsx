"use client"

import { useEffect } from "react"
import { X, Clock, Calendar, MapPin, Star, Tag, MessageSquare, Target, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { CompletedSession } from "./time-tracker"

interface SessionDetailModalProps {
  isOpen: boolean
  session: CompletedSession | null
  onClose: () => void
  onStartSimilar?: (sessionData: any) => void
}

export function SessionDetailModal({ isOpen, session, onClose, onStartSimilar }: SessionDetailModalProps) {
  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      // モーダルが開いた時：背景スクロールを無効化
      document.body.style.overflow = 'hidden'
    } else {
      // モーダルが閉じた時：背景スクロールを復元
      document.body.style.overflow = 'unset'
    }

    // クリーンアップ：コンポーネントがアンマウントされる時にスクロールを復元
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !session) return null

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const formatDateTime = (date: Date) => {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    const day = d.getDate()
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
    const weekday = weekdays[d.getDay()]
    
    return `${year}/${month}/${day} ${weekday}曜日`
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😞", "😐", "🙂", "😊", "😄"]
    return emojis[mood - 1] || "🙂"
  }

  const getMoodText = (mood: number) => {
    const texts = ["とても悪い", "悪い", "普通", "良い", "とても良い"]
    return texts[mood - 1] || "普通"
  }



  const activityInfo = {
    icon: session.activityIcon,
    color: session.activityColor,
    category: "その他"
  }

  const handleStartSimilar = () => {
    if (onStartSimilar) {
      const sessionData = {
        activityId: session.id,
        activityName: session.activityName,
        startTime: new Date(),
        location: session.location,
        notes: "",
        targetTime: session.targetTime
      }
      onStartSimilar(sessionData)
    }
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="bg-gray-900 border-gray-800 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* アクティビティヘッダー */}
          <div className={`p-4 rounded-lg ${activityInfo.color} bg-opacity-20 border border-opacity-30 mb-4`}>
            <div className="flex items-center space-x-3">
              <div className={`w-16 h-16 ${activityInfo.color} rounded-full flex items-center justify-center text-3xl`}>
                {activityInfo.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{session.activityName}</h2>
                <div className="flex items-center text-green-400 mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-mono text-lg">{formatDuration(session.duration)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300 font-medium">実施日時</span>
                </div>
                <div className="text-white">
                  <div>{formatDateTime(session.startTime)}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {session.startTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ～ {session.endTime.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {session.location && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300 font-medium">場所</span>
                  </div>
                  <div className="text-white">{session.location}</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 目標時間と達成度 */}
          {session.targetTime && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300 font-medium">目標達成度</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">目標時間</span>
                    <span className="text-white">{formatDuration(session.targetTime * 60)}</span>
                  </div>
                  <Progress 
                    value={Math.min((session.duration / (session.targetTime * 60)) * 100, 100)} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">達成率</span>
                    <span className={`font-medium ${
                      session.duration >= session.targetTime * 60 ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {Math.round((session.duration / (session.targetTime * 60)) * 100)}%
                      {session.duration >= session.targetTime * 60 && " 🎉"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 気分評価 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 font-medium">気分</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getMoodEmoji(session.mood || 3)}</div>
                <div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (session.mood || 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-white mt-1">{getMoodText(session.mood || 3)}</div>
                </div>
              </div>
            </CardContent>
          </Card>



          {/* 学びや成果 */}
          {session.achievements && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 font-medium">学びや成果</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.achievements}</div>
              </CardContent>
            </Card>
          )}

          {/* 課題や改善点 */}
          {session.challenges && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-300 font-medium">課題や改善点</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.challenges}</div>
              </CardContent>
            </Card>
          )}

          {/* その他のメモ */}
          {session.notes && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-gray-300 font-medium">その他のメモ</span>
                </div>
                <div className="text-white whitespace-pre-wrap">{session.notes}</div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 