"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
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

  const handleViewPlans = () => {
    onClose()
    router.push('/plan')
  }

  const getLimitText = () => {
    if (currentPlan === 'free') {
      return '目標を追加するには\nStandardプランへの登録が必要です'
    } else if (currentPlan === 'standard') {
      return '目標を追加するには\nPremiumプランへの登録が必要です'
    }
    return '制限に達しました'
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
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 h-12"
          >
            詳しくみる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

