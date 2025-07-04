import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ActivitiesProvider } from "@/contexts/activities-context"
import { SessionsProvider } from "@/contexts/sessions-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning className="dark">
      <body className={`${inter.className} dark`} suppressHydrationWarning>
        <ActivitiesProvider>
          <SessionsProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </SessionsProvider>
        </ActivitiesProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "SHONIN - 証人",
  description: "あなたの成長を見つめ、証明する",
  generator: 'v0.dev'
};
