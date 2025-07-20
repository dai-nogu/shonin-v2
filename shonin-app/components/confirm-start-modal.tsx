"use client"

import { Play, X, Target, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGoalsDb } from "@/hooks/use-goals-db"
import { useEffect, useState } from "react"

interface Activity {
  id: string
  name: string
  duration: string
  date: string
  rating: number
  category: string
  icon: string
  color: string
  goalId?: string
  goalTitle?: string
  location?: string
}

interface ConfirmStartModalProps {
  isOpen: boolean
  activity: Activity | null
  onConfirm: () => void
  onCancel: () => void
  showTags?: boolean
}

export function ConfirmStartModal({ isOpen, activity, onConfirm, onCancel, showTags = true }: ConfirmStartModalProps) {
  const [isMobile, setIsMobile] = useState(false)
  
  // 目標管理フック
  const { getGoal } = useGoalsDb()
  
  // 目標情報を取得
  const goalInfo = activity?.goalId ? getGoal(activity.goalId) : null

  // モバイル判定
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // モーダルが開いている間は背景スクロールを無効にする
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  if (!isOpen || !activity) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <Card 
        className={`bg-gray-900 border-gray-800 max-w-md w-full mx-auto ${
          isMobile ? 'h-[500px] overflow-hidden' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative pb-3">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
          <CardTitle className="text-white text-center text-lg">開始しますか？</CardTitle>
        </CardHeader>

        <CardContent className={`space-y-4 ${isMobile ? 'h-[420px] overflow-y-auto' : 'space-y-6'}`}>
          {/* アクティビティ情報 */}
          <div className={`p-3 rounded-lg ${activity.color} bg-opacity-20 border border-opacity-30`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-xl`}>
                {activity.icon}
              </div>
              <div>
                <h3 className="text-white font-semibold text-base">{activity.name}</h3>
              </div>
            </div>

            {/* 前回の記録情報 - SPでは横並び */}
            <div className={`bg-opacity-50 rounded p-3 space-y-2 ${isMobile ? 'space-y-1' : ''}`}>
              <div className={`flex items-center justify-between text-sm ${isMobile ? 'text-xs' : ''}`}>
                <span>前回の記録時間:</span>
                <span className="text-green-400 font-mono">{activity.duration}</span>
              </div>
              <div className={`flex items-center justify-between text-sm ${isMobile ? 'text-xs' : ''}`}>
                <span>前回の実施日:</span>
                <span>{activity.date}</span>
              </div>
            </div>

            {/* 場所情報 - SPでは常に表示 */}
            <div className={`bg-opacity-50 rounded p-3 mt-2 ${isMobile ? 'mt-1' : ''}`}>
              <div className={`flex items-center justify-between text-sm ${isMobile ? 'text-xs' : ''}`}>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>場所:</span>
                </div>
                <span className="text-gray-300">{activity.location || '未設定'}</span>
              </div>
            </div>

            {/* 目標情報 - SPでは常に表示 */}
            <div className={`bg-blue-500 bg-opacity-10 rounded p-3 border border-blue-500 border-opacity-30 mt-2 ${isMobile ? 'mt-1' : ''}`}>
              <div className="flex items-center space-x-2 mb-1">
                <Target className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-medium text-xs">関連する目標</span>
              </div>
              {goalInfo ? (
                <>
                  <div className={`text-white font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{goalInfo.title}</div>
                  {goalInfo.description && (
                    <div className={`text-gray-300 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>{goalInfo.description}</div>
                  )}
                </>
              ) : (
                <div className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>未設定</div>
              )}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              size={isMobile ? "sm" : "default"}
            >
              いいえ
            </Button>
            <Button 
              onClick={onConfirm} 
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              size={isMobile ? "sm" : "default"}
            >
              <Play className="w-4 h-4 mr-2" />
              はい、開始する
            </Button>
          </div>

          {/* 励ましメッセージ */}
          <div className="text-center">
            <p className={`text-gray-400 italic ${isMobile ? 'text-xs' : 'text-sm'}`}>"継続は力なり - あなたの努力を記録します"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
