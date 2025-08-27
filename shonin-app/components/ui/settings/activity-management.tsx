"use client"

import { Activity, Trash2 } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useToast } from "@/contexts/toast-context"

interface ActivityManagementProps {
  currentSession?: {
    activityId: string
    activityName: string
  } | null
  isSessionActive?: boolean
}

export function ActivityManagement({ currentSession, isSessionActive }: ActivityManagementProps) {
  const { activities: customActivities, loading: activitiesLoading, deleteActivity } = useActivities()
  const { showWarning } = useToast()

  // アクティビティ削除ハンドラー
  const handleDeleteActivity = async (activityId: string) => {
    // 現在進行中のアクティビティかチェック
    if (isSessionActive && currentSession && currentSession.activityId === activityId) {
      showWarning("進行中は削除できません。先にアクティビティを終了してください。")
      return
    }

    const confirmed = confirm("このアクティビティを削除しますか？\n関連するセッションデータも削除されます。")
    if (confirmed) {
      await deleteActivity(activityId)
      // エラーは useActivities hook で既に処理されているので、重複alertは削除
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">
          アクティビティ管理
        </CardTitle>
        <p className="text-gray-400 text-sm">
          進行中のアクティビティは削除できません。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activitiesLoading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>アクティビティを読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 bg-gray-800 rounded-lg border border-gray-700 space-y-2"
              >
                {/* タイトル行：アイコン・名前・ステータス・削除ボタンを横並び */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {activity.icon ? (
                      <span className="text-lg">{activity.icon}</span>
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${activity.color}`}></div>
                    )}
                    <span className="text-white font-medium">{activity.name}</span>
                    {/* 現在進行中のアクティビティの場合は表示 */}
                    {isSessionActive && currentSession && currentSession.activityId === activity.id && (
                      <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">
                        進行中
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteActivity(activity.id)}
                    variant="ghost"
                    size="sm"
                    disabled={!!(isSessionActive && currentSession && currentSession.activityId === activity.id)}
                    className={`p-2 ${
                      isSessionActive && currentSession && currentSession.activityId === activity.id
                        ? "text-gray-500 cursor-not-allowed opacity-50"
                        : "text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {customActivities.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>カスタムアクティビティがありません</p>
                <p className="text-sm">ダッシュボードで新しいアクティビティを追加できます</p>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-medium">💡 ヒント:</span> 
            新しいアクティビティはダッシュボードの「アクティビティを選択」から追加できます
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 