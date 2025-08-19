import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let res = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 認証不要なパス
  const publicPaths = ['/login', '/callback']

  // Supabaseクライアントをミドルウェア用に初期化
  const supabase = createMiddlewareClient(request, res)

  // 現在のセッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 未認証ユーザーがログイン必須のページに来たらリダイレクト
  if (!session && !publicPaths.includes(pathname)) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 認証済みユーザーが "/" や "/login" にアクセスした場合はダッシュボードへ
  if (session && (pathname === '/' || pathname === '/login')) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return res
}

export const config = {
  matcher: [
    // 除外するパスを設定
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}
