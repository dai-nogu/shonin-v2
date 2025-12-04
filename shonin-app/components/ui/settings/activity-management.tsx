"use client"

import { useState } from "react"
import { Activity, Trash2 } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { Card, CardContent } from "@/components/ui/common/card"
import { Button } from "@/components/ui/common/button"
import { useToast } from "@/contexts/toast-context"
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/settings/alert-dialog"

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
  
  // 削除確認ダイアログの状態管理
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 削除ボタンクリック時
  const handleDeleteClick = (activityId: string) => {
    // 現在進行中のアクティビティかチェック
    if (isSessionActive && currentSession && currentSession.activityId === activityId) {
      showWarning(t('settings.delete_activity_warning'))
      return
    }

    setSelectedActivityId(activityId)
    setDeleteDialogOpen(true)
  }

  // 削除確定時
  const handleDeleteConfirm = async () => {
    if (!selectedActivityId) return
    
    setIsDeleting(true)
    await deleteActivity(selectedActivityId)
    setIsDeleting(false)
    setDeleteDialogOpen(false)
    setSelectedActivityId(null)
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="space-y-4 px-0 pt-0">
        {activitiesLoading ? (
          <div className="text-center py-8 text-gray-300">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>{t('settings.loading_activities')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 bg-gray-700 rounded-lg border border-gray-600 space-y-2"
              >
                {/* タイトル行：色・名前・ステータス・削除ボタンを横並び */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full ${activity.color}`}></div>
                    <span className="text-white font-medium">{activity.name}</span>
                    {/* 現在進行中のアクティビティの場合は表示 */}
                    {isSessionActive && currentSession && currentSession.activityId === activity.id && (
                      <span className="text-green-300 text-xs bg-green-900 px-2 py-1 rounded-full">
                        {t('settings.in_progress')}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteClick(activity.id)}
                    variant="ghost"
                    size="sm"
                    disabled={!!(isSessionActive && currentSession && currentSession.activityId === activity.id)}
                    className={`p-2 ${
                      isSessionActive && currentSession && currentSession.activityId === activity.id
                        ? "text-gray-500 cursor-not-allowed opacity-50"
                        : "text-red-400 hover:text-red-300 hover:bg-red-900"
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
      </CardContent>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">
              {t('settings.delete_activity_confirmation_title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {t('settings.delete_activity_confirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 hover:text-white"
            >
              {t('settings.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('settings.deleting')}</span>
                </div>
              ) : (
                t('settings.delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 