"use client"

import { useState, useEffect } from "react"
import { User, Globe, Activity, Trash2, Edit2, LogOut } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { useTimezone } from "@/contexts/timezone-context"
import { TIMEZONES } from "@/lib/timezone-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { useUserProfile } from "@/hooks/use-user-profile"
import { supabase } from "@/lib/supabase"

interface SettingsProps {
  onBack: () => void
  currentSession?: {
    activityId: string
    activityName: string
  } | null
  isSessionActive?: boolean
}

export function Settings({ onBack, currentSession, isSessionActive }: SettingsProps) {
  const isMobile = useIsMobile()
  const { signOut, user } = useAuth()
  const { profile, loading: profileLoading, updateUserName } = useUserProfile()
  
  // 編集モードの管理
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // ユーザー情報（データベースから取得）
  const [name, setName] = useState("")
  const [email, setEmail] = useState(user?.email || "")

  // タイムゾーン設定
  const { 
    timezone, 
    setTimezone, 
    getTimezoneDisplayName 
  } = useTimezone()

  // ユーザー情報が更新された際に状態を同期
  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
    }
  }, [user])

  // プロフィール情報をローカル状態に同期
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
    }
  }, [profile])

    // アクティビティ管理
  const { activities: customActivities, loading: activitiesLoading, deleteActivity } = useActivities()

  // 保存ハンドラー
  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const success = await updateUserName(name)
      if (success) {
        setIsEditingProfile(false)
        alert("プロフィール情報が保存されました")
      } else {
        alert("プロフィール情報の保存に失敗しました")
      }
    } catch (error) {
      console.error('プロフィール保存エラー:', error)
      alert("プロフィール情報の保存に失敗しました")
    } finally {
      setIsSaving(false)
    }
  }

  // ログアウト処理
  const handleLogout = () => {
    signOut()
  }

  // ユーザーアカウント削除（危険な操作）
  const handleDeleteAccount = async () => {
    const confirmText = "アカウントを削除"
    const inputText = prompt(
      `⚠️ 警告: この操作は取り消せません！\n\nアカウントとすべてのデータが完全に削除されます。\n削除を実行するには「${confirmText}」と入力してください:`
    )
    
    if (inputText !== confirmText) {
      if (inputText !== null) {
        alert("入力が正しくありません。アカウント削除をキャンセルしました。")
      }
      return
    }

    try {
      // バックエンドAPIを呼び出してユーザーアカウントを削除
      const response = await fetch('/api/deleteUser', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        alert("アカウントが削除されました。ご利用ありがとうございました。")
        await signOut() // ログアウト処理
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'アカウント削除に失敗しました')
      }
    } catch (error) {
      console.error('アカウント削除エラー:', error)
      alert("アカウント削除中にエラーが発生しました。時間をおいて再度お試しください。")
    }
  }

  // アクティビティ削除ハンドラー
  const handleDeleteActivity = async (activityId: string) => {
    // 現在進行中のアクティビティかチェック
    if (isSessionActive && currentSession && currentSession.activityId === activityId) {
      alert("進行中のアクティビティは削除できません。先にアクティビティを終了してください。")
      return
    }

    const confirmed = confirm("このアクティビティを削除しますか？\n関連するセッションデータも削除されます。")
    if (confirmed) {
      const success = await deleteActivity(activityId)
      if (!success) {
        alert("アクティビティの削除に失敗しました")
      }
    }
  }

  return (
    <div className="bg-gray-950 text-white">{/* ヘッダーは統一Header使用のため削除 */}

      <div className="container mx-auto max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <User className="w-4 h-4" />
              <span className={isMobile ? "hidden" : "block"}>プロフィール</span>
            </TabsTrigger>
            <TabsTrigger value="timezone" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <Globe className="w-4 h-4" />
              <span className={isMobile ? "hidden" : "block"}>タイムゾーン</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <Activity className="w-4 h-4" />
              <span className={isMobile ? "hidden" : "block"}>アクティビティ</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <LogOut className="w-4 h-4" />
              <span className={isMobile ? "hidden" : "block"}>アカウント管理</span>
            </TabsTrigger>
          </TabsList>

          {/* プロフィールタブ */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    {isEditingProfile ? "プロフィールを編集" : "プロフィール"}
                  </CardTitle>
                  <div className="flex space-x-2">
                    {!isEditingProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(true)}
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">名前</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditingProfile}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">メールアドレス</Label>
                    <Input
                      type="email"
                      value={email}
                      disabled={true}
                      className="bg-gray-800 border-gray-700 text-white disabled:opacity-50"
                      placeholder="Google認証により自動設定"
                    />
                  </div>
                </div>
                
                {/* 編集中のボタン */}
                {isEditingProfile && (
                  <div className="flex space-x-3 mt-6">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      {isSaving ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>保存中...</span>
                        </div>
                      ) : (
                        "保存"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={isSaving}
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      キャンセル
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* タイムゾーンタブ */}
          <TabsContent value="timezone" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">タイムゾーン設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">タイムゾーン</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue>
                        {getTimezoneDisplayName(timezone)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {TIMEZONES.map((tz) => (
                        <SelectItem 
                          key={tz.value} 
                          value={tz.value}
                          className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 注意事項 */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium text-sm">タイムゾーン設定について</p>
                      <ul className="text-blue-200 text-sm mt-1 space-y-1">
                        <li>• 時間記録、統計、連続日数の計算に影響します</li>
                        <li>• 変更は即座に反映されます</li>
                        <li>• 過去のデータも新しいタイムゾーンで表示されます</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* アクティビティタブ */}
          <TabsContent value="activities" className="space-y-6">
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
          </TabsContent>

          {/* アカウント管理タブ */}
          <TabsContent value="account" className="space-y-6">
            {/* アカウント管理セクション */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <LogOut className="w-5 h-5" />
                  <span>アカウント管理</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                                 <div className="flex items-center justify-between">
                   <div>
                     <Label className="text-gray-300">ログアウト</Label>
                     <p className="text-sm text-gray-400">アカウントからサインアウトします</p>
                     <p className="text-sm text-gray-400">ログアウト後は、再度ログインが必要になります。</p>
                   </div>
                   <Button 
                     onClick={handleLogout}
                     className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                   >
                     <LogOut className="w-4 h-4 mr-2" />
                     ログアウト
                   </Button>
                 </div>

                 <div className="pt-4 border-t border-gray-700">
                   <div className="flex items-center justify-between">
                     <div>
                       <Label className="text-red-400">アカウント削除</Label>
                       <p className="text-sm text-gray-400">⚠️ この操作は取り消しできません</p>
                       <p className="text-sm text-gray-400">すべてのデータが完全に削除されます。</p>
                     </div>
                     <Button 
                       onClick={handleDeleteAccount}
                       variant="outline"
                       className="bg-red-950 border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
                     >
                       <Trash2 className="w-4 h-4 mr-2" />
                       アカウント削除
                     </Button>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 