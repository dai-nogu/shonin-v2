import createIntlMiddleware from 'next-intl/middleware'
import { locales } from './i18n/request'

export default createIntlMiddleware({
  locales,
  defaultLocale: 'ja',
  localePrefix: 'always'
})

export const config = {
  matcher: [
    // 除外するパスを設定
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
