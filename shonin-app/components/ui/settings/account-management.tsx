"use client"

import { LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { LogoutSection } from "./logout-section"
import { DeleteAccountSection } from "./delete-account-section"
import { useTranslations } from 'next-intl'

export function AccountManagement() {
  const t = useTranslations()
  
  return (
    <Card className="bg-gray-800 border-gray-700 shadow-sm">
      <CardHeader>
        <CardTitle className="text-white">
          {t('settings.account_management')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LogoutSection />

        <div className="pt-4 border-t border-gray-700">
          <DeleteAccountSection />
        </div>
      </CardContent>
    </Card>
  )
} 