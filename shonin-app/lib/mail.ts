/**
 * メール送信ユーティリティ
 * サーバー内部から直接呼び出し可能（CSRF保護をバイパス）
 */

import { AuthEmailTemplate } from '@/components/emails/auth-email-template';
import { SubscriptionEmailTemplate } from '@/components/emails/subscription-email-template';
import { Resend } from 'resend';
import React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

// メール送信元アドレス
const EMAIL_FROM = 'Shonin <no-reply@account-shonin.com>';

// 型定義
export type EmailCategory = 'auth' | 'subscription';
export type AuthEmailType = 'welcome' | 'welcome_back' | 'goodbye';
export type SubscriptionEmailType = 'upgrade' | 'downgrade' | 'downgrade_scheduled';

export interface SendEmailParams {
  email: string;
  firstName?: string;
  emailCategory: EmailCategory;
  emailType: AuthEmailType | SubscriptionEmailType;
  planName?: string;
  currentPlanName?: string;
  changeDate?: string;
}

export interface SendEmailResult {
  success: boolean;
  data?: any;
  error?: any;
}

/**
 * メールを送信する共通関数
 * サーバー内部から直接呼び出し可能
 */
export async function sendEmailInternal(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    const { 
      email, 
      firstName = 'ユーザー', 
      emailCategory, 
      emailType,
      planName,
      currentPlanName,
      changeDate,
    } = params;

    console.log('=== メール送信処理開始 ===');
    console.log('送信先:', email);
    console.log('カテゴリ:', emailCategory);
    console.log('メールタイプ:', emailType);

    if (!email) {
      console.error('エラー: メールアドレスが提供されていません');
      return { success: false, error: 'Email address is required' };
    }

    let subject: string;
    let emailTemplate: React.ReactElement;

    if (emailCategory === 'auth') {
      const authType = emailType as AuthEmailType;
      
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

    } else if (emailCategory === 'subscription') {
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
      console.error('エラー: 不正なemailCategory:', emailCategory);
      return { success: false, error: 'Invalid email category' };
    }
    
    console.log('件名:', subject);

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      subject: subject,
      react: emailTemplate,
    });

    if (error) {
      console.error('Resendエラー:', error);
      return { success: false, error };
    }

    console.log('✓ メール送信成功:', data);
    return { success: true, data };
  } catch (error) {
    console.error('メール送信中に予期しないエラー:', error);
    return { success: false, error };
  }
}

