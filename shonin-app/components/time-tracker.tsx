"use client"

import { useState } from "react"
import { ActivitySelector } from "./activity-selector"
import { ActiveSession } from "./active-session"
import { QuickStart } from "./quick-start"

export interface Activity {
  id: string
  name: string
  category: string
  icon: string
  color: string
}

export interface SessionData {
  activityId: string
  activityName: string
  startTime: Date
  location: string
  notes: string
  targetTime?: number // 目標時間（分単位）
  activityColor?: string // アクティビティの色
  activityIcon?: string // アクティビティのアイコン
  goalId?: string // 紐付ける目標のID
}

export interface CompletedSession extends SessionData {
  id: string
  duration: number
  endTime: Date
  mood?: number
  achievements?: string
  challenges?: string
  // アクティビティ情報
  activityColor?: string
  activityIcon?: string
}

interface TimeTrackerProps {
  onStartSession: (sessionData: SessionData) => void
  completedSessions: CompletedSession[]
  onGoalSettingClick?: () => void
}

export function TimeTracker({ onStartSession, completedSessions, onGoalSettingClick }: TimeTrackerProps) {
  const handleStartSession = (sessionData: SessionData) => {
    onStartSession(sessionData)
  }

  return (
    <div className="space-y-6">
      <QuickStart completedSessions={completedSessions} onStartActivity={handleStartSession} />
      <ActivitySelector onStart={handleStartSession} onGoalSettingClick={onGoalSettingClick} />
    </div>
  )
}
