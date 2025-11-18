import { AuthEmailTemplate } from '../../../components/emails/auth-email-template';
import { SubscriptionEmailTemplate } from '../../../components/emails/subscription-email-template';
import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import React from 'react';

// .env.localにRESEND_API_KEYが設定されていることを確認
const resend = new Resend(process.env.RESEND_API_KEY);

type EmailCategory = 'auth' | 'subscription';
type AuthEmailType = 'welcome' | 'welcome_back' | 'goodbye';
type SubscriptionEmailType = 'upgrade' | 'downgrade' | 'downgrade_scheduled';

interface EmailRequestBody {
  email: string;
  firstName?: string;
  emailCategory: EmailCategory;
  emailType: AuthEmailType | SubscriptionEmailType;
  planName?: string; // subscription用
  currentPlanName?: string; // downgrade_scheduled用
  changeDate?: string; // downgrade_scheduled用
  isNewUser?: boolean; // 後方互換性用
}

export async function POST(request: NextRequest) {
  try {
    // リクエストボディからユーザー情報を取得
    const body = await request.json() as EmailRequestBody;
    const { 
      email, 
      firstName = 'ユーザー', 
      emailCategory, 
      emailType,
      planName,
      currentPlanName,
      changeDate,
      isNewUser = true 
    } = body;

    console.log('=== メール送信API呼び出し ===');
    console.log('リクエストbody:', JSON.stringify(body, null, 2));

    // メールアドレスが提供されているか確認
    if (!email) {
      console.error('エラー: メールアドレスが提供されていません');
      return Response.json({ error: 'Email address is required' }, { status: 400 });
    }

    // emailCategoryが指定されていない場合は、emailTypeから判定（後方互換性）
    let category: EmailCategory = emailCategory;
    if (!category) {
      if (['welcome', 'welcome_back', 'goodbye'].includes(emailType)) {
        category = 'auth';
      } else if (['upgrade', 'downgrade'].includes(emailType)) {
        category = 'subscription';
      } else {
        // さらに後方互換性: emailTypeもない場合はisNewUserで判定
        category = 'auth';
      }
    }

    let subject: string;
    let emailTemplate: React.ReactElement;

    // カテゴリ別に処理を分岐
    if (category === 'auth') {
      // 認証・アカウント関連メール
      const authType = emailType as AuthEmailType || (isNewUser ? 'welcome' : 'welcome_back');
      
      switch (authType) {
        case 'welcome':
          subject = 'Shoninへようこそ！';
          break;
        case 'welcome_back':
          subject = 'おかえりなさい！';
          break;
        case 'goodbye':
          subject = 'ご利用ありがとうございました';
          break;
        default:
          subject = 'Shoninからのお知らせ';
      }

      emailTemplate = AuthEmailTemplate({ 
        firstName, 
        emailType: authType 
      });

    } else if (category === 'subscription') {
      // プラン・サブスクリプション関連メール
      const subType = emailType as SubscriptionEmailType;
      
      switch (subType) {
        case 'upgrade':
          subject = `${planName || 'Standard'}プランへようこそ！`;
          break;
        case 'downgrade_scheduled':
          subject = 'プラン変更のお知らせ';
          break;
        case 'downgrade':
          subject = `${planName || 'Free'}プランに変更されました`;
          break;
        default:
          subject = 'プラン変更のお知らせ';
      }

      emailTemplate = SubscriptionEmailTemplate({ 
        firstName, 
        emailType: subType,
        planName,
        currentPlanName,
        changeDate
      });

    } else {
      console.error('エラー: 不正なemailCategory:', category);
      return Response.json({ error: 'Invalid email category' }, { status: 400 });
    }
    
    console.log('カテゴリ:', category);
    console.log('メールタイプ:', emailType);
    console.log('件名:', subject);

    const { data, error } = await resend.emails.send({
      from: 'Shonin <no-reply@account-shonin.com>',
      to: [email],
      subject: subject,
      react: emailTemplate,
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