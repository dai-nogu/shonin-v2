import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const locales = ['ja', 'en']
  
  // ロケールを含まないパスの場合は、デフォルトロケール（ja）にリダイレクト
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  )

  if (pathnameIsMissingLocale && pathname !== '/') {
    // デフォルトロケール（ja）を追加してリダイレクト
    return NextResponse.redirect(new URL(`/ja${pathname}`, request.url))
  }

  // ルートパスの場合は /ja にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/ja', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
} 