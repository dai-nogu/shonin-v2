import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { safeError } from '@/lib/safe-logger'

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
      const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        safeError('OAuth callback error', error)
        // エラーの場合はログインページにリダイレクト
        return NextResponse.redirect(new URL(`/${locale}/login?error=auth_error`, requestUrl.origin))
      }
      
      // 新規ユーザーかどうかを確認
      // handle_new_userトリガーで既にusersテーブルにレコードが作成されているため、
      // アカウント作成時刻で判定する（作成から30秒以内なら新規ユーザー）
      if (user) {
        // ユーザーの名前を取得（user_metadataから取得、なければメールアドレスの@前を使用）
        const firstName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'ユーザー';
        
        // ユーザーの作成時刻を取得
        const userCreatedAt = new Date(user.created_at)
        const now = new Date()
        const timeDifferenceInSeconds = (now.getTime() - userCreatedAt.getTime()) / 1000
        
        // アカウント作成から30秒以内なら新規ユーザーとみなす
        const isNewUser = timeDifferenceInSeconds <= 30
        
        console.log('ユーザー情報:', {
          created_at: user.created_at,
          time_difference_seconds: timeDifferenceInSeconds,
          is_new_user: isNewUser
        });
        
        // メール送信
        try {
          if (isNewUser) {
            console.log('新規ユーザー登録: ウェルカムメールを送信します', user.email);
          } else {
            console.log('既存ユーザーのログイン: おかえりなさいメールを送信します', user.email);
          }
          
          const emailPayload = {
            email: user.email,
            firstName: firstName,
            isNewUser: isNewUser,
          };
          console.log('メール送信ペイロード:', JSON.stringify(emailPayload, null, 2));
          
          // メール送信APIを呼び出し
          const emailResponse = await fetch(`${requestUrl.origin}/api/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          })
          
          const emailResult = await emailResponse.json();
          console.log('メール送信APIのレスポンス:', JSON.stringify(emailResult, null, 2));
          console.log('ステータスコード:', emailResponse.status);
          
          if (!emailResponse.ok) {
            console.error('メール送信APIがエラーを返しました:', emailResult);
          }
        } catch (emailError) {
          // メール送信エラーはログのみ（ユーザー登録は継続）
          console.error('メール送信中にエラーが発生:', emailError);
          safeError('Email send error', emailError)
        }
      }
      
      return response
    } catch (error) {
      safeError('OAuth exchange error', error)
      return NextResponse.redirect(new URL(`/${locale}/login?error=exchange_error`, requestUrl.origin))
    }
  }

  // コードがない場合はログインページにリダイレクト
  return NextResponse.redirect(new URL(`/${locale}/login?error=no_code`, requestUrl.origin))
} 