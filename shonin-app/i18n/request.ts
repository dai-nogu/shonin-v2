import { getRequestConfig } from 'next-intl/server'

// 対応する言語のリスト
export const locales = ['ja', 'en'] as const
export type Locale = typeof locales[number]

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: locale === 'ja' ? 'Asia/Tokyo' : 'UTC'
  }
}) 