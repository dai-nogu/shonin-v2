import { getRequestConfig } from 'next-intl/server'

// 対応する言語のリスト
export const locales = ['ja', 'en'] as const
export type Locale = typeof locales[number]

export default getRequestConfig(async ({ locale }) => {
  // localeが未定義またはサポートされていない場合はデフォルトを使用
  const validLocale = locale && locales.includes(locale as Locale) ? locale : 'ja'
  
  return {
    locale: validLocale,
    messages: (await import(`../messages/${validLocale}.json`)).default,
    timeZone: validLocale === 'ja' ? 'Asia/Tokyo' : 'UTC'
  }
}) 