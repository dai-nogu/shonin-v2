import type React from "react"
import { Inter } from "next/font/google"
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import "../globals.css"
import { ActivitiesProvider } from "@/contexts/activities-context"
import { SessionsProvider } from "@/contexts/sessions-context"
import { TimezoneProvider } from "@/contexts/timezone-context"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/contexts/toast-context"
import { ConditionalSidebarProvider } from "@/components/layout/conditional-sidebar-provider"

const inter = Inter({ subsets: ["latin"] })

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

  return (
    <html lang={locale} suppressHydrationWarning className="dark">
      <body className={`${inter.className} dark`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <TimezoneProvider>
              <ToastProvider>
                <ActivitiesProvider>
                  <SessionsProvider>
                    <ConditionalSidebarProvider>
                      {children}
                    </ConditionalSidebarProvider>
                  </SessionsProvider>
                </ActivitiesProvider>
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