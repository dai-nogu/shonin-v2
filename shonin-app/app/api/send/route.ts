import { EmailTemplate } from '../../../components/email-template'; // 必要に応じてパスを調整
import { Resend } from 'resend';

// .env.localにRESEND_API_KEYが設定されていることを確認
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@account-shonin.com', // 認証済みドメインを使用
      to: ['noguchi.daisukeeee@gmail.com'], // 受信者またはテストアドレスに置き換え
      subject: 'Hello from Resend and Next.js!',
      react: EmailTemplate({ firstName: 'Test' }), // テンプレートにpropsを渡す
      // または、`html`を使用:
      // html: '<strong>It works!</strong>'
    });

    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    return Response.json(data);
  } catch (error) {
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