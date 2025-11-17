import { EmailTemplate } from '../../../components/email-template'; // 必要に応じてパスを調整
import { Resend } from 'resend';
import { NextRequest } from 'next/server';

// .env.localにRESEND_API_KEYが設定されていることを確認
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // リクエストボディからユーザー情報を取得
    const body = await request.json();
    const { email, firstName, isNewUser = true } = body;

    console.log('=== メール送信API呼び出し ===');
    console.log('リクエストbody:', JSON.stringify(body, null, 2));
    console.log('email:', email);
    console.log('firstName:', firstName);
    console.log('isNewUser:', isNewUser);

    // メールアドレスが提供されているか確認
    if (!email) {
      console.error('エラー: メールアドレスが提供されていません');
      return Response.json({ error: 'Email address is required' }, { status: 400 });
    }

    // 新規ユーザーか既存ユーザーかで件名を変更
    const subject = isNewUser ? 'Shoninへようこそ！' : 'おかえりなさい！';
    console.log('件名:', subject);

    const { data, error } = await resend.emails.send({
      from: 'Shonin <no-reply@account-shonin.com>', // 認証済みドメインを使用
      to: [email], // 登録したユーザーのメールアドレスを使用
      subject: subject,
      react: EmailTemplate({ 
        firstName: firstName || 'ユーザー',
        isNewUser: isNewUser
      }), // ユーザーの名前とステータスを渡す
    });

    if (error) {
      console.error('Resendエラー:', error);
      return Response.json({ error }, { status: 400 });
    }

    console.log('メール送信成功:', data);
    return Response.json(data);
  } catch (error) {
    console.error('予期しないエラー:', error);
    return Response.json({ error }, { status: 500 });
  }
}

// pages/api/send.ts (Pages Router 例 - インポート/レスポンスを適応)
// import type { NextApiRequest, NextApiResponse } from 'next';
// import { EmailTemplate } from '../../components/EmailTemplate';
// import { Resend } from 'resend';
//
// const resend = new Resend(process.env.RESEND_API_KEY);
//
// export default async (req: NextApiRequest, res: NextApiResponse) => {
//   try { // エラーハンドリングのためにtry...catchを追加
//     const { data, error } = await resend.emails.send({
//       from: 'Your Name <you@yourverifieddomain.com>',
//       to: ['delivered@resend.dev'],
//       subject: 'Hello world',
//       react: EmailTemplate({ firstName: 'John' }),
//     });
//
//     if (error) {
//       return res.status(400).json(error);
//     }
//
//     res.status(200).json(data);
//   } catch (e) {
//      res.status(500).json({ error: 'Internal Server Error' });
//   }
// };