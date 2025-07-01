"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Activity {
  id: string
  name: string
  category: string
  icon: string
  color: string
}

// 初期のアクティビティデータ（空の状態から開始）
const INITIAL_ACTIVITIES: Activity[] = []

interface ActivitiesContextType {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, "id">) => string
  deleteActivity: (activityId: string) => void
  getActivity: (activityId: string) => Activity | undefined
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

interface ActivitiesProviderProps {
  children: ReactNode
}

export function ActivitiesProvider({ children }: ActivitiesProviderProps) {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES)

  const addActivity = (activity: Omit<Activity, "id">) => {
    const newActivity: Activity = {
      ...activity,
      id: `custom-${Date.now()}`,
    }
    setActivities(prev => [...prev, newActivity])
    return newActivity.id
  }

  const deleteActivity = (activityId: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== activityId))
  }

  const getActivity = (activityId: string) => {
    return activities.find(activity => activity.id === activityId)
  }

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        addActivity,
        deleteActivity,
        getActivity,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  )
}

export function useActivities() {
  const context = useContext(ActivitiesContext)
  if (context === undefined) {
    throw new Error("useActivities must be used within an ActivitiesProvider")
  }
  return context
} 