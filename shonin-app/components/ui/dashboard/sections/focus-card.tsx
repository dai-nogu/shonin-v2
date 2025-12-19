"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Play, Square, Plus, ChevronRight, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { Input } from "@/components/ui/common/input"
import { useSessions } from "@/contexts/sessions-context"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useActivities } from "@/contexts/activities-context"
import { useTranslations } from 'next-intl'
import type { SessionData } from "../time-tracker"
import type { Database } from '@/types/database'

type DbGoal = Database['public']['Tables']['goals']['Row']

interface FocusCardProps {
  initialGoals?: DbGoal[]
  onStartSession: (sessionData: SessionData) => void
}

export function FocusCard({ initialGoals, onStartSession }: FocusCardProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  const t = useTranslations()
  
  const { goals: dbGoals } = useGoalsDb(initialGoals)
  const { activities, addActivity } = useActivities()
  const {
    currentSession,
    isSessionActive,
    formattedTime,
    sessionState,
  } = useSessions()
  
  const [activityInput, setActivityInput] = useState("")
  const [isStarting, setIsStarting] = useState(false)
  
  // アクティブな目標を取得（最初の1つ）
  const activeGoal = dbGoals?.find(g => g.status === 'active')
  
  // 進捗率を計算
  const getProgressPercentage = () => {
    if (!activeGoal || !activeGoal.target_duration) return 0
    const current = activeGoal.current_value || 0
    const target = activeGoal.target_duration
    return Math.min((current / target) * 100, 100)
  }

  // セッション開始処理
  const handleStartSession = async () => {
    if (!activityInput.trim() || isStarting) return
    
    setIsStarting(true)
    
    try {
      // 既存のアクティビティを探すか、新規作成
      let activityId = ""
      const existingActivity = activities.find(
        a => a.name.toLowerCase() === activityInput.toLowerCase()
      )
      
      if (existingActivity) {
        activityId = existingActivity.id
      } else {
        // 新規アクティビティを作成
        const result = await addActivity({
          name: activityInput,
          icon: null,
          color: "bg-usuzumi",
          goal_id: activeGoal?.id || null,
        })
        
        if (result.success) {
          activityId = result.data
        } else {
          setIsStarting(false)
          return
        }
      }
      
      const sessionData: SessionData = {
        activityId,
        activityName: activityInput,
        startTime: new Date(),
        location: "",
        notes: "",
        activityColor: existingActivity?.color || "bg-usuzumi",
        activityIcon: existingActivity?.icon || undefined,
        goalId: activeGoal?.id,
      }
      
      onStartSession(sessionData)
      setActivityInput("")
    } finally {
      setIsStarting(false)
    }
  }

  // セッション詳細表示
  const handleViewSession = () => {
    router.push("/session")
  }

  // 目標編集
  const handleEditGoal = () => {
    if (activeGoal) {
      router.push(`/${locale}/goals/edit/${activeGoal.id}`)
    } else {
      router.push(`/${locale}/goals/add`)
    }
  }

  return (
    <Card className="bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        {/* ヘッダー：目標情報 */}
        <div 
          className="flex items-center space-x-3 mb-4 cursor-pointer group"
          onClick={handleEditGoal}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-lg">
            {activeGoal ? "🎯" : <Target className="w-5 h-5 text-gray-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate group-hover:text-emerald-400 transition-colors">
              {activeGoal?.title || t('focus.no_goal')}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
        </div>

        {/* プログレスバー */}
        {activeGoal && activeGoal.target_duration && (
          <div className="mb-6">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* セッション中の場合：タイマー表示 */}
        {isSessionActive && currentSession ? (
          <>
            {/* タイマー */}
            <div className="text-center py-6">
              <div className="text-5xl md:text-6xl font-bold text-white font-mono tracking-wider">
                {formattedTime}
              </div>
              {sessionState === "paused" && (
                <div className="text-yellow-400 text-sm mt-2">
                  {t('timer.paused')}
                </div>
              )}
            </div>

            {/* アクティビティ名 */}
            <div className="bg-gray-800/50 rounded-xl p-3 mb-4 flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentSession.activityColor || 'bg-gray-700'}`}>
                {currentSession.activityIcon || currentSession.activityName.charAt(0)}
              </div>
              <span className="text-white flex-1 truncate">{currentSession.activityName}</span>
            </div>

            {/* ボタン */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500"
                onClick={handleViewSession}
              >
                <Play className="w-6 h-6 fill-current" />
              </Button>
              <Button
                variant="outline"
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={handleViewSession}
              >
                {t('focus.end_session')}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 入力フィールド */}
            <div className="relative mb-4">
              <Input
                type="text"
                placeholder={t('focus.what_are_you_working')}
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleStartSession()
                  }
                }}
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12 pr-12"
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:text-white"
                onClick={() => {/* TODO: 履歴から選択 */}}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* 開始ボタン */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                onClick={handleStartSession}
                disabled={!activityInput.trim() || isStarting}
              >
                {isStarting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-1" />
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
