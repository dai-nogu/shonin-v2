import type React from "react"
import { Noto_Serif_JP } from "next/font/google"
import "../globals.css"

const notoSerifJP = Noto_Serif_JP({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
})

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body 
        className={`${notoSerifJP.variable} font-serif-jp antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}

export const metadata = {
  title: "Shonin - あなたの成長を見つめ、証明する",
  description: "Be a witness to your growth. 日々の努力を記録・可視化し、成長の実感を促進するアプリ",
}
