"use client"

import { useState } from "react"
import { ArrowLeft, Clock, Calendar, Star, Tag, MapPin, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { CompletedSession } from "./time-tracker"

interface SessionHistoryProps {
  sessions: CompletedSession[]
  onBack: () => void
  onStartNew: () => void
}

export function SessionHistory({ sessions, onBack, onStartNew }: SessionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<string>("all")

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}時間${minutes}分`
    }
    return `${minutes}分`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "今日"
    if (diffDays === 1) return "昨日"
    if (diffDays < 7) return `${diffDays}日前`

    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    })
  }

  const getMoodEmoji = (mood: number) => {
    const emojis = ["😞", "😐", "🙂", "😊", "😄"]
    return emojis[mood - 1] || "🙂"
  }

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    if (selectedFilter === "all") return matchesSearch
    // 他のフィルター条件を追加可能
    return matchesSearch
  })

  const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0)
  const totalSessions = sessions.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <CardTitle className="text-white">セッション履歴</CardTitle>
            </div>
            <Button onClick={onStartNew} className="bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4 mr-2" />
              新しい記録
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{totalSessions}</div>
            <div className="text-sm text-gray-400">総セッション数</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{formatTime(totalTime)}</div>
            <div className="text-sm text-gray-400">総記録時間</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {totalSessions > 0 ? formatTime(Math.floor(totalTime / totalSessions)) : "0分"}
            </div>
            <div className="text-sm text-gray-400">平均セッション時間</div>
          </CardContent>
        </Card>
      </div>

      {/* 検索・フィルター */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <Input
              placeholder="アクティビティやタグで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* セッション一覧 */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                {sessions.length === 0 ? "まだセッションがありません" : "検索条件に一致するセッションがありません"}
              </div>
              <Button onClick={onStartNew} className="bg-green-500 hover:bg-green-600">
                最初のセッションを開始
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredSessions.map((session) => (
            <Card key={session.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* セッション基本情報 */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">{session.activityName}</h3>
                      <div className="flex items-center text-green-400 font-mono">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(session.duration)}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(session.endTime)}
                      </div>
                    </div>

                    {/* タグと場所 */}
                    <div className="flex items-center space-x-4 mb-3">
                      {session.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {session.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {session.location && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {session.location}
                        </div>
                      )}
                    </div>

                    {/* 成果と課題 */}
                    {(session.achievements || session.challenges) && (
                      <div className="space-y-2 mb-3">
                        {session.achievements && (
                          <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-20 rounded p-3">
                            <div className="text-green-400 text-sm font-medium mb-1">✅ 成果・学び</div>
                            <div className="text-gray-300 text-sm">{session.achievements}</div>
                          </div>
                        )}

                        {session.challenges && (
                          <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-20 rounded p-3">
                            <div className="text-yellow-400 text-sm font-medium mb-1">💡 課題・改善点</div>
                            <div className="text-gray-300 text-sm">{session.challenges}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* メモ */}
                    {session.notes && (
                      <div className="bg-gray-800 rounded p-3 mb-3">
                        <div className="text-gray-400 text-sm font-medium mb-1">📝 メモ</div>
                        <div className="text-gray-300 text-sm">{session.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* 気分評価 */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-2xl">{getMoodEmoji(session.mood)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
