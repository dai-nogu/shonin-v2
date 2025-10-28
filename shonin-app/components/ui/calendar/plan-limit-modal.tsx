"use client"

import { Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/common/dialog"
import { Button } from "@/components/ui/common/button"

interface PlanLimitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlanLimitModal({ isOpen, onClose }: PlanLimitModalProps) {
  const router = useRouter()

  const handleViewPlans = () => {
    onClose()
    router.push('/plan')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl text-white">
            過去のカレンダーを見るには
            <br />
            Standardプランへの登録が必要です
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 mt-4">
            Freeプランでは過去のカレンダーを閲覧できません。
            <br />
            Standardプランにアップグレードすると全期間のカレンダーを閲覧できます。
          </DialogDescription>
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

