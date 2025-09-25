"use client"

import { Activity, Trash2 } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useToast } from "@/contexts/toast-context"
import { useTranslations } from 'next-intl'

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
  const t = useTranslations()

  // アクティビティ削除ハンドラー
  const handleDeleteActivity = async (activityId: string) => {
    // 現在進行中のアクティビティかチェック
    if (isSessionActive && currentSession && currentSession.activityId === activityId) {
      showWarning(t('settings.delete_activity_warning'))
      return
    }

    const confirmed = confirm(t('settings.delete_activity_confirmation'))
    if (confirmed) {
      await deleteActivity(activityId)
      // エラーは useActivities hook で既に処理されているので、重複alertは削除
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">
          {t('settings.activity_management')}
        </CardTitle>
        <p className="text-gray-400 text-sm">
          {t('settings.activity_management_description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {activitiesLoading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>{t('settings.loading_activities')}</p>
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
                        {t('settings.in_progress')}
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
                <p>{t('settings.no_custom_activities')}</p>
                <p className="text-sm">{t('settings.add_activities_hint')}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            <span className="font-medium">💡 {t('settings.tip')}:</span> 
            {t('settings.add_activities_tip')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 