"use client"

import { useState, useEffect } from "react"
import { Pause, Play, Square, MessageSquare, Camera, Mic, Edit3, Save, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { SessionData } from "./time-tracker"

interface ActiveSessionProps {
  session: SessionData
  onEnd: () => void
  onSave: (sessionData: any) => void
}

type SessionState = "active" | "paused" | "ended"

export function ActiveSession({ session, onEnd, onSave }: ActiveSessionProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sessionState, setSessionState] = useState<SessionState>("active")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [mood, setMood] = useState<number>(3)
  const [achievements, setAchievements] = useState("")
  const [challenges, setChallenges] = useState("")

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (sessionState === "active") {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - session.startTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [sessionState, session.startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const handleTogglePause = () => {
    setSessionState(sessionState === "active" ? "paused" : "active")
  }

  const handleEnd = () => {
    setSessionState("ended")
    setShowNotes(true) // 終了時に自動でメモ欄を表示
  }

  const handleResume = () => {
    setSessionState("active")
    setShowNotes(false)
  }

  const handleSave = () => {
    const sessionData = {
      ...session,
      duration: elapsedTime,
      endTime: new Date(),
      notes,
      mood,
      achievements,
      challenges,
    }

    onSave(sessionData)
    onEnd()
  }

  const getStatusInfo = () => {
    switch (sessionState) {
      case "active":
        return { color: "bg-green-500", text: "記録中", icon: "🟢" }
      case "paused":
        return { color: "bg-yellow-500", text: "一時停止中", icon: "⏸️" }
      case "ended":
        return { color: "bg-blue-500", text: "振り返り中", icon: "✏️" }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* メインタイマーカード */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <div
              className={`w-3 h-3 ${statusInfo.color} rounded-full ${sessionState === "active" ? "animate-pulse" : ""}`}
            />
            <span className="text-green-400 font-medium">{statusInfo.text}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{session.activityName}</h2>
          {session.location && <p className="text-gray-400 text-sm">📍 {session.location}</p>}
        </CardHeader>

        <CardContent className="text-center space-y-6">
          {/* 経過時間表示 */}
          <div className="space-y-2">
            <div
              className={`text-6xl font-mono font-bold ${sessionState === "ended" ? "text-blue-400" : "text-white"}`}
            >
              {formatTime(elapsedTime)}
            </div>
            <div className="text-gray-400 text-sm">
              開始時刻:{" "}
              {session.startTime.toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          {/* タグ表示 */}
          {session.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {session.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-gray-700 text-gray-300">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 制御ボタン */}
          <div className="flex justify-center space-x-4">
            {sessionState === "ended" ? (
              // 終了後のボタン
              <>
                <Button
                  onClick={handleResume}
                  variant="outline"
                  size="lg"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  再開
                </Button>
                <Button onClick={handleSave} size="lg" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-5 h-5 mr-2" />
                  保存
                </Button>
              </>
            ) : (
              // 通常の制御ボタン
              <>
                <Button
                  onClick={handleTogglePause}
                  variant="outline"
                  size="lg"
                  className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  {sessionState === "paused" ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      再開
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      一時停止
                    </>
                  )}
                </Button>

                <Button onClick={handleEnd} variant="destructive" size="lg" className="bg-red-600 hover:bg-red-700">
                  <Square className="w-5 h-5 mr-2" />
                  終了
                </Button>
              </>
            )}
          </div>

          {/* 状態別メッセージ */}
          {sessionState === "paused" && (
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-3">
              <p className="text-yellow-400 text-sm">⏸️ 一時停止中です。準備ができたら再開してください。</p>
            </div>
          )}

          {sessionState === "ended" && (
            <div className="bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30 rounded-lg p-3">
              <p className="text-blue-400 text-sm">✏️ お疲れさまでした！振り返りを記録して保存しましょう。</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* アクション・メモカード */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Button
              onClick={() => setShowNotes(!showNotes)}
              variant={showNotes ? "default" : "outline"}
              className={
                showNotes
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              メモ
            </Button>

            <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              <Camera className="w-4 h-4 mr-2" />
              写真
            </Button>

            <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              <Mic className="w-4 h-4 mr-2" />
              音声
            </Button>

            <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              <Edit3 className="w-4 h-4 mr-2" />
              編集
            </Button>
          </div>

          {/* メモ・振り返り入力エリア */}
          {showNotes && (
            <div className="space-y-4">
              {/* 気分評価 */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm font-medium">今の気分はどうですか？</Label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      onClick={() => setMood(rating)}
                      variant={mood === rating ? "default" : "outline"}
                      size="sm"
                      className={
                        mood === rating
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      }
                    >
                      {rating === 1 && "😞"}
                      {rating === 2 && "😐"}
                      {rating === 3 && "🙂"}
                      {rating === 4 && "😊"}
                      {rating === 5 && "😄"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* 学びや成果 */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm font-medium">今日学んだことや成果</Label>
                <Textarea
                  placeholder="どんなことを学びましたか？どんな成果がありましたか？"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                />
              </div>

              {/* 課題や改善点 */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm font-medium">課題や次回への改善点</Label>
                <Textarea
                  placeholder="どんな課題がありましたか？次回はどう改善しますか？"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                />
              </div>

              {/* 自由記述メモ */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm font-medium">その他のメモ</Label>
                <Textarea
                  placeholder="その他、記録しておきたいことがあれば..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 min-h-[80px]"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 励ましメッセージ */}
      <Card className="bg-gradient-to-r from-green-500 to-blue-500 bg-opacity-20 border-green-500 border-opacity-30">
        <CardContent className="p-4 text-center">
          {sessionState === "active" && (
            <>
              <p className="text-green-400 font-medium">🌟 素晴らしい集中力です！</p>
              <p className="text-gray-300 text-sm mt-1">誰も見ていなくても、私たちはあなたの努力を見ています</p>
            </>
          )}
          {sessionState === "paused" && (
            <>
              <p className="text-yellow-400 font-medium">⏸️ 少し休憩しましょう</p>
              <p className="text-gray-300 text-sm mt-1">準備ができたら、また一緒に頑張りましょう</p>
            </>
          )}
          {sessionState === "ended" && (
            <>
              <p className="text-blue-400 font-medium">🎉 お疲れさまでした！</p>
              <p className="text-gray-300 text-sm mt-1">あなたの努力は確実に積み重なっています</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
