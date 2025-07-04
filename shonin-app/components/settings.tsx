"use client"

import { useState } from "react"
import { Save, User, Lock, Globe, Bell, Eye, EyeOff, Activity, Trash2, Plus } from "lucide-react"
import { useActivities } from "@/contexts/activities-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SettingsProps {
  onBack: () => void
  currentSession?: {
    activityId: string
    activityName: string
  } | null
  isSessionActive?: boolean
}

export function Settings({ onBack, currentSession, isSessionActive }: SettingsProps) {
  // ユーザー情報
  const [name, setName] = useState("山田太郎")
  const [email, setEmail] = useState("yamada@example.com")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 地域・時間設定
  const [timezone, setTimezone] = useState("Asia/Tokyo")

  // 通知設定
  const [goalReminders, setGoalReminders] = useState(true)

  // アクティビティ管理
  const { activities: customActivities, deleteActivity } = useActivities()

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // 保存処理のシミュレーション
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // 成功メッセージなどを表示
    alert("設定が保存されました")
  }

  const handleDeleteActivity = (activityId: string) => {
    // 現在進行中のアクティビティかどうかをチェック
    if (isSessionActive && currentSession && currentSession.activityId === activityId) {
      alert("現在進行中のアクティビティは削除できません。\nセッションを終了してから削除してください。")
      return
    }
    
    if (confirm("このアクティビティを削除しますか？")) {
      deleteActivity(activityId)
    }
  }

  const validatePasswords = () => {
    if (newPassword && newPassword !== confirmPassword) {
      return "新しいパスワードが一致しません"
    }
    if (newPassword && newPassword.length < 8) {
      return "パスワードは8文字以上で入力してください"
    }
    return null
  }

  const passwordError = validatePasswords()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">設定</h1>
        </div>
      </div>

      <div className="p-6 container mx-auto max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-800">
            <TabsTrigger value="profile" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <User className="w-4 h-4" />
              <span>プロフィール</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <Lock className="w-4 h-4" />
              <span>セキュリティ</span>
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <Activity className="w-4 h-4" />
              <span>アクティビティ</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2 data-[state=active]:bg-gray-800">
              <Bell className="w-4 h-4" />
              <span>通知・その他</span>
            </TabsTrigger>
          </TabsList>

          {/* プロフィールタブ */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  プロフィール情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">名前</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">メールアドレス</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* セキュリティタブ */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  パスワード変更
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">現在のパスワード</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">新しいパスワード</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">新しいパスワード（確認）</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                {passwordError && (
                  <div className="text-red-400 text-sm">{passwordError}</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* アクティビティタブ */}
          <TabsContent value="activities" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  アクティビティ管理
                </CardTitle>
                <p className="text-gray-400 text-sm">
                  カスタムアクティビティの管理ができます。進行中のアクティビティは削除できません。
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {customActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                    >
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
                        disabled={isSessionActive && currentSession && currentSession.activityId === activity.id}
                        className={`p-2 ${
                          isSessionActive && currentSession && currentSession.activityId === activity.id
                            ? "text-gray-500 cursor-not-allowed opacity-50"
                            : "text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                
                <div className="pt-2 border-t border-gray-700">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium">💡 ヒント:</span> 
                    新しいアクティビティはダッシュボードの「アクティビティを選択」から追加できます
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通知・その他タブ */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  通知設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-300">目標リマインダー</Label>
                    <p className="text-sm text-gray-400">目標達成をサポートする通知</p>
                  </div>
                  <Switch
                    checked={goalReminders}
                    onCheckedChange={setGoalReminders}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  地域・時間設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">タイムゾーン</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Asia/Tokyo">日本 (JST)</SelectItem>
                      <SelectItem value="America/New_York">ニューヨーク (EST)</SelectItem>
                      <SelectItem value="Europe/London">ロンドン (GMT)</SelectItem>
                      <SelectItem value="Asia/Shanghai">上海 (CST)</SelectItem>
                      <SelectItem value="Australia/Sydney">シドニー (AEDT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 保存ボタン - すべてのタブで共通 */}
          <div className="flex justify-end pt-6 border-t border-gray-800">
            <Button
              onClick={handleSave}
              disabled={isSaving || !!passwordError}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>保存中...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>設定を保存</span>
                </div>
              )}
            </Button>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 