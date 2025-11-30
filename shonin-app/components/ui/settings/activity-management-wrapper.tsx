"use client"

import { ActivityManagement } from "./activity-management"
import { useSessions } from "@/contexts/sessions-context"

export function ActivityManagementWrapper() {
  const { currentSession, isSessionActive } = useSessions()

  return (
    <ActivityManagement 
      currentSession={currentSession}
      isSessionActive={isSessionActive}
    />
  )
}

