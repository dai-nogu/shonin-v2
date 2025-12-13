"use client"

import { memo } from "react"
import { Card, CardContent } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'

export const AIFeedbackUpgradePrompt = memo(function AIFeedbackUpgradePrompt() {
  const t = useTranslations()
  const router = useRouter()

  return (
    <Card className="bg-transparent border-white/10">
      <CardContent className="pt-6">
        <div className="text-center py-8 space-y-4">
          <h3 className="text-xl font-medium text-white mb-6">
            {t('plan.limit_modal.ai_feedback_line1')}
          </h3>
          <Button
            onClick={() => router.push('/plan')}
            className="bg-emerald-700 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t('plan.limit_modal.view_plans')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

