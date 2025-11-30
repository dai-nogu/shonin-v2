"use client"

import React, { createContext, useContext, useState, type ReactNode } from "react"

interface UIState {
  isGoalEditing: boolean
  isGoalAdding: boolean
  setIsGoalEditing: (editing: boolean) => void
  setIsGoalAdding: (adding: boolean) => void
}

const UIContext = createContext<UIState | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
  const [isGoalEditing, setIsGoalEditing] = useState(false)
  const [isGoalAdding, setIsGoalAdding] = useState(false)

  return (
    <UIContext.Provider value={{
      isGoalEditing,
      isGoalAdding,
      setIsGoalEditing,
      setIsGoalAdding
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
} 