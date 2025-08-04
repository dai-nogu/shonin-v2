"use client"

import { createContext, useContext, ReactNode } from "react"
import { useActivitiesDb } from "@/hooks/use-activities-db"

export interface Activity {
  id: string
  name: string
  icon: string | null
  color: string
}

interface ActivitiesContextType {
  activities: Activity[]
  loading: boolean
  error: string | null
  addActivity: (activity: Omit<Activity, "id">) => Promise<string | null>
  deleteActivity: (activityId: string) => Promise<boolean>
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
    return await addActivityDb(activity)
  }

  const deleteActivity = async (activityId: string) => {
    return await deleteActivityDb(activityId)
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