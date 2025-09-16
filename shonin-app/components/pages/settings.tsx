"use client"

import { User, Globe, Activity, LogOut } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/common/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProfileSettings } from "@/components/ui/settings/profile-settings"
import { TimezoneSettings } from "@/components/ui/settings/timezone-settings"
import { LanguageSettings } from "@/components/ui/settings/language-settings"
import { ActivityManagement } from "@/components/ui/settings/activity-management"
import { AccountManagement } from "@/components/ui/settings/account-management"

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

  return (
    <div className="bg-gray-950 text-white">
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
            <ProfileSettings />
          </TabsContent>

          {/* タイムゾーンタブ */}
          <TabsContent value="timezone" className="space-y-6">
            <TimezoneSettings />
            <LanguageSettings />
          </TabsContent>

          {/* アクティビティタブ */}
          <TabsContent value="activities" className="space-y-6">
            <ActivityManagement 
              currentSession={currentSession}
              isSessionActive={isSessionActive}
            />
          </TabsContent>

          {/* アカウント管理タブ */}
          <TabsContent value="account" className="space-y-6">
            <AccountManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 