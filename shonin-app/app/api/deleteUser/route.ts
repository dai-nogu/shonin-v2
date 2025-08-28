import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SERVICE_ROLE_KEY as string
)

export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（簡易版）
    const userAgent = request.headers.get('user-agent')
    const xForwardedFor = request.headers.get('x-forwarded-for')
    
    // Authorizationヘッダーからトークンを取得
    const authorization = request.headers.get('authorization')
    const token = authorization?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: '認証トークンが見つかりません' }, { status: 401 })
    }

    // トークンを使用してユーザー情報を取得
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'ユーザーが認証されていません' }, { status: 401 })
    }

    // Service Role Keyを使用してユーザーを削除
    const { data: deletedUser, error } = await supabaseServer.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('アカウント削除に失敗しました')
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'ユーザーが削除されました' }, { status: 200 })
  } catch (error) {
    console.error('予期しないエラー:', error)
    return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 })
  }
} 