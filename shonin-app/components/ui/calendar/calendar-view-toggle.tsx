"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/common/button"
import { Calendar } from "lucide-react"

interface CalendarViewToggleProps {
  viewMode: "month" | "week"
}

export function CalendarViewToggle({ viewMode }: CalendarViewToggleProps) {
  const router = useRouter()

  return (
    <div className="bg-gray-900 px-2 md:px-4 pt-6 pb-3">
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => router.push("/calendar/month")}
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          className={
            viewMode === "month"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          }
        >
          <Calendar className="w-4 h-4 mr-1" />
          月表示
        </Button>
        <Button
          onClick={() => router.push("/calendar/week")}
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          className={
            viewMode === "week"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
          }
        >
          <Calendar className="w-4 h-4 mr-1" />
          週表示
        </Button>
      </div>
    </div>
  )
} 