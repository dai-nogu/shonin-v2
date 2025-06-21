import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider } from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning className="dark">
      <body className={`${inter.className} dark`}>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </body>
    </html>
  )
}

export const metadata = {
  title: "SHONIN - 証人",
  description: "あなたの成長を見つめ、証明する",
  generator: 'v0.dev'
};
