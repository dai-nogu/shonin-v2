import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ActivitiesProvider } from "@/contexts/activities-context"
import { SessionsProvider } from "@/contexts/sessions-context"
import { TimezoneProvider } from "@/contexts/timezone-context"
import { AuthProvider } from "@/contexts/auth-context"
import { UIProvider } from "@/contexts/ui-context"
import { ConditionalSidebarProvider } from "@/components/conditional-sidebar-provider"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning className="dark">
      <body className={`${inter.className} dark`} suppressHydrationWarning>
        <AuthProvider>
          <TimezoneProvider>
            <ActivitiesProvider>
              <SessionsProvider>
                <UIProvider>
                  <ConditionalSidebarProvider>
                    {children}
                  </ConditionalSidebarProvider>
                </UIProvider>
              </SessionsProvider>
            </ActivitiesProvider>
          </TimezoneProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "SHONIN - 証人",
  description: "あなたの成長を見つめ、証明する",
  generator: 'v0.dev'
};
