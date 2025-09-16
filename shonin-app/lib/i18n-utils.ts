import { useTranslations } from 'next-intl'

// クライアントコンポーネント用のフック
export function useI18n() {
  const t = useTranslations()
  return { t }
}

// 言語設定のユーティリティ
export const SUPPORTED_LOCALES = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
] as const

export type SupportedLocale = typeof SUPPORTED_LOCALES[number]['code']

export function getLocaleDisplayName(locale: string): string {
  const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale)
  return localeInfo ? `${localeInfo.flag} ${localeInfo.name}` : locale
} 