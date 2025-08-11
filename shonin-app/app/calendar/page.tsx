"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    // デフォルトで月表示にリダイレクト
    router.push("/calendar/month")
  }, [router])

  return (
    <div className="fixed inset-0 bg-gray-950 text-white flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">カレンダーを読み込み中...</p>
      </div>
    </div>
  )
} 