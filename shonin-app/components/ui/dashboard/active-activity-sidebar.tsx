"use client"

import { Play, Pause, Clock, Target, Square } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { SessionData } from "./time-tracker"
import { useSessions } from "@/contexts/sessions-context"

interface ActiveActivitySidebarProps {
  activeSession: SessionData | null
  isActive: boolean
  onViewSession: () => void
  onTogglePause: () => void
  onEnd: () => void
  sessionState: "active" | "paused" | "ended"
}

export function ActiveActivitySidebar({ 
  activeSession, 
  isActive, 
  onViewSession, 
  onTogglePause,
  onEnd,
  sessionState 
}: ActiveActivitySidebarProps) {
  // セッションコンテキストから一元化された時間データを取得
  const { elapsedTime, formattedTime } = useSessions()

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

  if (!isActive || !activeSession) {
    return null
  }

  const statusInfo = getStatusInfo()

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          進行中...
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ステータス */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 ${statusInfo.color} rounded-full ${sessionState === "active" ? "animate-pulse" : ""}`}
          />
          <span className="text-green-400 text-sm font-medium">{statusInfo.text}</span>
        </div>

        {/* 行動名 */}
        <div>
          <h3 className="text-white font-semibold text-lg">{activeSession.activityName}</h3>
          {activeSession.location && (
            <p className="text-gray-400 text-xs">📍 {activeSession.location}</p>
          )}
        </div>

        {/* 経過時間 */}
        <div className="text-center">
          <div className="text-2xl font-mono font-bold text-white">
            {formattedTime}
          </div>
          <div className="text-gray-400 text-xs">
            開始: {activeSession.startTime.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* 目標時間の進捗 */}
        {activeSession.targetTime && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>目標</span>
              <span>{Math.floor(activeSession.targetTime / 60)}h {activeSession.targetTime % 60}m</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  elapsedTime >= activeSession.targetTime * 60
                    ? "bg-green-500"
                    : elapsedTime >= activeSession.targetTime * 60 * 0.8
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min((elapsedTime / (activeSession.targetTime * 60)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-400 text-center">
              {Math.round((elapsedTime / (activeSession.targetTime * 60)) * 100)}%
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="space-y-2">
          <Button
            onClick={onViewSession}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            詳細を見る
          </Button>
          
          {sessionState !== "ended" && (
            <div className="flex space-x-2">
              <Button
                onClick={onTogglePause}
                variant="outline"
                size="sm"
                className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              >
                {sessionState === "paused" ? (
                  <>
                    <Play className="w-3 h-3 mr-1" />
                    再開
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    一時停止
                  </>
                )}
              </Button>
              
              <Button
                onClick={onEnd}
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="w-3 h-3 mr-1" />
                終了
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 