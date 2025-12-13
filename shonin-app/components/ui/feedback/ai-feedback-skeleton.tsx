"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"

export const AIFeedbackSkeleton = memo(function AIFeedbackSkeleton() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3 lg:pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-[1.25rem] md:text-2xl">
            <div className="h-7 w-48 bg-gray-800 animate-pulse rounded"></div>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-800 rounded-lg p-3 mb-3">
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 animate-pulse rounded w-full"></div>
            <div className="h-4 bg-gray-700 animate-pulse rounded w-5/6"></div>
            <div className="h-4 bg-gray-700 animate-pulse rounded w-4/6"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

