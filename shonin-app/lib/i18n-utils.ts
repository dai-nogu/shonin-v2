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

// i18n関連のユーティリティ関数

/**
 * ロケールに応じた日付フォーマットを返す
 * @param date - 日付文字列（YYYY/M/D形式）
 * @param locale - ロケール（'ja' | 'en'）
 * @returns フォーマットされた日付文字列
 */
export function formatDateForLocale(date: string, locale: string): string {
  // 日付文字列をパース（YYYY/M/D形式を想定）
  const parts = date.split('/')
  if (parts.length !== 3) return date
  
  const year = parseInt(parts[0])
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return date
  
  const dateObj = new Date(year, month - 1, day)
  
  if (locale === 'en') {
    // 英語: September 18, 2025
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else {
    // 日本語: 2025年9月18日
    return dateObj.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
} 