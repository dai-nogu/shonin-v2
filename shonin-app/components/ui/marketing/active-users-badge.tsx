'use client'

import { useEffect, useState } from 'react'
import { getActiveUsersCount } from '@/app/actions/active-users'
import { Users } from 'lucide-react'

interface ActiveUsersBadgeProps {
  className?: string
}

export function ActiveUsersBadge({ className = '' }: ActiveUsersBadgeProps) {
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveUsers = async () => {
      const result = await getActiveUsersCount()
      if (result.success) {
        setActiveUsersCount(result.data)
      }
      setIsLoading(false)
    }

    // 初回取得
    fetchActiveUsers()

    // 30秒ごとに更新
    const interval = setInterval(() => {
      fetchActiveUsers()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-900/20 border border-emerald-700/30 rounded-full ${className}`}>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" />
        <span className="text-sm text-gray-400 font-medium">...</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-emerald-900/20 border border-emerald-700/30 rounded-full ${className}`}>
      <div className="relative">
        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
        <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
      </div>
      <Users className="w-4 h-4 text-emerald-500" />
      <span className="text-sm text-emerald-400 font-medium">
        {activeUsersCount}人が没頭中
      </span>
    </div>
  )
}
