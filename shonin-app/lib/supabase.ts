import { createBrowserClient, createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// 環境変数
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ブラウザ用のクライアント（クライアントコンポーネント用）
export const createClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// サーバー用のクライアント（Server Components、Route Handlers、Server Actions用）
export const createServerComponentClient = () => {
  const { cookies } = require('next/headers')
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  })
}

// Route Handler用のクライアント
export const createRouteHandlerClient = (request: Request) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.headers.get('cookie')
          ?.split(';')
          ?.find(c => c.trim().startsWith(`${name}=`))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        // Route Handlerでは直接レスポンスヘッダーに設定
        // この設定は実際にはNextResponseで行う
      },
      remove(name: string, options: any) {
        // Route Handlerでは直接レスポンスヘッダーに設定
        // この設定は実際にはNextResponseで行う
      },
    },
  })
}

// Middleware用のクライアント
export const createMiddlewareClient = (request: any, response: any) =>
  createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

// 互換性のために元のexportも残しておく
export const supabase = createClient() 