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
  tags: string[]
  location: string
  notes: string
  targetTime?: number // 目標時間（分単位）
}

export interface CompletedSession extends SessionData {
  id: string
  duration: number
  endTime: Date
  mood: number
  achievements: string
  challenges: string
}

interface TimeTrackerProps {
  onStartSession: (sessionData: SessionData) => void
  completedSessions: CompletedSession[]
}

export function TimeTracker({ onStartSession, completedSessions }: TimeTrackerProps) {
  const handleStartSession = (sessionData: SessionData) => {
    onStartSession(sessionData)
  }

  return (
    <div className="space-y-6">
      <QuickStart completedSessions={completedSessions} onStartActivity={handleStartSession} />
      <ActivitySelector onStart={handleStartSession} />
    </div>
  )
}
