"use client"

import { LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/common/card"
import { LogoutSection } from "./logout-section"
import { DeleteAccountSection } from "./delete-account-section"

export function AccountManagement() {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <LogOut className="w-5 h-5" />
          <span>アカウント管理</span>
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