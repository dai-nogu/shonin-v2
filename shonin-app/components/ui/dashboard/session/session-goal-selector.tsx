"use client"

import { memo } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/common/button"
import { Label } from "@/components/ui/common/label"
import { useTranslations } from 'next-intl'
import { cn } from "@/lib/utils"

interface Goal {
  id: string
  title: string
  status?: string
}

interface SessionGoalSelectorProps {
  goals: Goal[]
  selectedGoalId: string | null
  setSelectedGoalId: (goalId: string | null) => void
  currentGoalId?: string | null
}

export const SessionGoalSelector = memo(function SessionGoalSelector({
  goals,
  selectedGoalId,
  setSelectedGoalId,
  currentGoalId
}: SessionGoalSelectorProps) {
  const t = useTranslations()

  // 既に目標が設定されている場合は表示のみ
  if (currentGoalId) {
    const goal = goals.find(g => g.id === currentGoalId)
    return (
      <div className="bg-emerald-700/10 border border-emerald-700/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-white font-semibold">
              {goal ? goal.title : t('active_session.no_goal')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 目標選択UI
  if (goals.length === 0) return null

  return (
    <div className="space-y-3 pb-6">
      <Label className="text-base font-medium">{t('active_session.select_goal_optional')}</Label>
      <div className="space-y-2">
        {goals.map((goal) => (
          <Button
            key={goal.id}
            onClick={() => setSelectedGoalId(goal.id)}
            variant={selectedGoalId === goal.id ? "default" : "outline"}
            className={cn(
              "w-full h-14 justify-start gap-3 text-base transition-all",
              selectedGoalId === goal.id
                ? "bg-emerald-700 text-white border-2 border-emerald-500"
                : "hover:bg-secondary"
            )}
          >
            <span className="font-semibold truncate flex-1 text-left">{goal.title}</span>
            {selectedGoalId === goal.id && (
              <Check className="w-5 h-5 ml-auto flex-shrink-0" />
            )}
          </Button>
        ))}
        <Button
          onClick={() => setSelectedGoalId(null)}
          variant={selectedGoalId === null ? "default" : "outline"}
          className={cn(
            "w-full h-12 text-sm",
            selectedGoalId === null
              ? "bg-gray-700 text-white"
              : "hover:bg-secondary"
          )}
        >
          {t('active_session.no_goal')}
        </Button>
      </div>
    </div>
  )
})

