"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function CalendarPage() {
  const router = useRouter()

  useEffect(() => {
    // デフォルトで月表示にリダイレクト
    router.push("/calendar/month")
  }, [router])

  // リダイレクト中は何も表示しない
  return null
} 