"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog"
import { Button } from "@/components/ui/common/button"
import { PlanType } from "@/types/subscription"

interface GoalLimitModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlan: PlanType
  currentGoalCount: number
}

export function GoalLimitModal({ isOpen, onClose, currentPlan, currentGoalCount }: GoalLimitModalProps) {
  const router = useRouter()
  const t = useTranslations('plan.limit_modal')

  const handleViewPlans = () => {
    onClose()
    router.push('/plan')
  }

  const getLimitText = () => {
    if (currentPlan === 'starter') {
      return t('goal_starter')
    } else if (currentPlan === 'standard') {
      return t('goal_standard')
    }
    return t('goal_default')
  }

  const limitText = getLimitText()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl text-white whitespace-pre-line">
            {limitText}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="mt-6">
          <Button
            onClick={handleViewPlans}
            className="w-full bg-emerald-700 text-white font-semibold py-3 h-12 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('view_plans')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

