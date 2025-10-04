import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const locale = requestUrl.searchParams.get('locale') || 'ja'

  if (code) {
    let response = NextResponse.redirect(new URL(`/${locale}/dashboard`, requestUrl.origin))
    
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
    
    try {
      // 認証コードをセッション情報に交換
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('OAuth callback error:', error)
        // エラーの場合はログインページにリダイレクト
        return NextResponse.redirect(new URL(`/${locale}/login?error=auth_error`, requestUrl.origin))
      }
      
      return response
    } catch (error) {
      console.error('OAuth exchange error:', error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=exchange_error`, requestUrl.origin))
    }
  }

  // コードがない場合はログインページにリダイレクト
  return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, requestUrl.origin))
} 