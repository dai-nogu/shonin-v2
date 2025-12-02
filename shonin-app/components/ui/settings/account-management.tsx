"use client"

import { LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/common/card"
import { LogoutSection } from "./logout-section"
import { DeleteAccountSection } from "./delete-account-section"
import { useTranslations } from 'next-intl'

export function AccountManagement() {
  const t = useTranslations()
  
  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardContent className="space-y-4 px-0 pt-0">
        <LogoutSection />

        <div className="pt-4 border-t border-gray-700">
          <DeleteAccountSection />
        </div>
      </CardContent>
    </Card>
  )
} 