import createMiddleware from 'next-intl/middleware'
import { locales } from './i18n/request'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// 認証が不要なパス
const publicPaths = ['/login', '/callback']

// next-intlのミドルウェアを作成
const intlMiddleware = createMiddleware({
  locales: locales,
  defaultLocale: 'ja',
  localePrefix: 'always'
})

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // ルートパスへのアクセスは /ja/ にリダイレクト
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/ja/'
    return NextResponse.redirect(url)
  }
  
  // 静的ファイルやAPIルート、callbackはスキップ（認証チェックなし）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/callback') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf)$/)
  ) {
    return NextResponse.next()
  }
  
  // next-intlのミドルウェアを実行
  const response = intlMiddleware(request)
  
  // URLからロケールを取得
  const locale = pathname.split('/')[1] // /ja/dashboard -> 'ja'
  
  // 認証が不要なパスかチェック
  const isPublicPath = publicPaths.some(path => 
    pathname === `/${locale}${path}` || pathname.startsWith(`/${locale}${path}/`)
  )
  
  // 認証が不要なパスの場合はそのまま通す
  if (isPublicPath) {
    return response
  }
  
  // Supabaseクライアントを作成
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  // セッションを確認
  const { data: { session } } = await supabase.auth.getSession()
  
  // 認証が必要なパスで、セッションがない場合はログインページにリダイレクト
  if (!session) {
    // BASE_URLを使用してリダイレクトURLを構築
    const loginUrl = `${process.env.BASE_URL}/${locale}/login`
    return NextResponse.redirect(loginUrl)
  }
  
  return response
}

export const config = {
  matcher: [
    '/',
    '/(ja|en)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)'
  ]
} 