"use client"

import { createContext, useContext, ReactNode } from "react"
import { useActivitiesDb } from "@/hooks/use-activities-db"
import { refreshHorizonCache } from "@/lib/cache-utils"
import type { Result } from "@/types/result"

export interface Activity {
  id: string
  name: string
  icon: string | null
  color: string
  goal_id?: string | null
}

interface ActivitiesContextType {
  activities: Activity[]
  loading: boolean
  error: string | null
  addActivity: (activity: Omit<Activity, "id">) => Promise<Result<string>>
  deleteActivity: (activityId: string) => Promise<Result<void>>
  getActivity: (activityId: string) => Activity | undefined
  refetch: () => Promise<void>
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

interface ActivitiesProviderProps {
  children: ReactNode
}

export function ActivitiesProvider({ children }: ActivitiesProviderProps) {
  const {
    activities,
    loading,
    error,
    addActivity: addActivityDb,
    deleteActivity: deleteActivityDb,
    getActivity,
    refetch,
  } = useActivitiesDb()

  const addActivity = async (activity: Omit<Activity, "id">) => {
    const result = await addActivityDb(activity)
    // 成功したらHorizon画面のキャッシュを更新
    if (result.success) {
      refreshHorizonCache()
    }
    return result
  }

  const deleteActivity = async (activityId: string) => {
    const result = await deleteActivityDb(activityId)
    // 成功したらHorizon画面のキャッシュを更新
    if (result.success) {
      refreshHorizonCache()
    }
    return result
  }

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        loading,
        error,
        addActivity,
        deleteActivity,
        getActivity,
        refetch,
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