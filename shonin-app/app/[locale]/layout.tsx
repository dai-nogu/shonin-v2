import type React from "react"
import { Noto_Serif, Noto_Serif_JP } from "next/font/google"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import "../globals.css"
import { ActivitiesProvider } from "@/contexts/activities-context"
import { SessionsProvider } from "@/contexts/sessions-context"
import { TimezoneProvider } from "@/contexts/timezone-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/contexts/toast-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { FeedbackProvider } from "@/contexts/feedback-context"
import { ConditionalSidebarProvider } from "@/components/layout/conditional-sidebar-provider"

const notoSerif = Noto_Serif({ 
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-serif",
  display: "swap",
})

const notoSerifJP = Noto_Serif_JP({ 
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-serif-jp",
  display: "swap",
})

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  // ロケールに応じてフォントを切り替え
  const fontClass = locale === 'ja' 
    ? `${notoSerifJP.variable} font-serif-jp` 
    : `${notoSerif.variable} font-serif`

  return (
    <html lang={locale} suppressHydrationWarning className="dark">
      <body className={`${fontClass} dark`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <TimezoneProvider>
              <ToastProvider>
                <SubscriptionProvider>
                  <FeedbackProvider>
                    <ActivitiesProvider>
                      <SessionsProvider>
                        <ConditionalSidebarProvider>
                          {children}
                        </ConditionalSidebarProvider>
                      </SessionsProvider>
                    </ActivitiesProvider>
                  </FeedbackProvider>
                </SubscriptionProvider>
              </ToastProvider>
            </TimezoneProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

export async function generateStaticParams() {
  return [
    { locale: 'ja' },
    { locale: 'en' }
  ]
}

// 動的メタデータ生成
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  return {
    title: locale === 'ja' ? "No Name yet" : "No Name yet",
    description: locale === 'ja' 
      ? "あなたの成長を見つめ、証明する" 
      : "Be a witness to your growth",
    generator: 'v0.dev'
  }
} 