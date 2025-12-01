/**
 * メール送信APIエンドポイント
 * クライアント（ブラウザ）からの呼び出し用
 * CSRF保護あり
 */

import { NextRequest } from 'next/server';
import { validateOrigin } from '@/lib/csrf-protection';
import { 
  sendEmailInternal, 
  type EmailCategory,
  type AuthEmailType,
  type SubscriptionEmailType,
} from '@/lib/mail';

interface EmailRequestBody {
  email: string;
  firstName?: string;
  emailCategory: EmailCategory;
  emailType: AuthEmailType | SubscriptionEmailType;
  planName?: string;
  currentPlanName?: string;
  changeDate?: string;
  isNewUser?: boolean; // 後方互換性用
}

export async function POST(request: NextRequest) {
  try {
    // CSRF保護: Origin/Refererチェック（クライアントからの攻撃を防ぐ）
    if (!validateOrigin(request)) {
      console.warn('CSRF attempt detected: Invalid origin', {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      });
      return Response.json(
        { error: 'Invalid origin' },
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const body = await request.json() as EmailRequestBody;
    const { 
      email, 
      firstName, 
      emailCategory, 
      emailType,
      planName,
      currentPlanName,
      changeDate,
      isNewUser = true 
    } = body;

    console.log('=== メール送信API呼び出し ===');
    console.log('リクエストbody:', JSON.stringify(body, null, 2));

    // emailCategoryが指定されていない場合は、emailTypeから判定（後方互換性）
    let category: EmailCategory = emailCategory;
    if (!category) {
      if (['welcome', 'welcome_back', 'goodbye'].includes(emailType)) {
        category = 'auth';
      } else if (['upgrade', 'downgrade', 'downgrade_scheduled'].includes(emailType)) {
        category = 'subscription';
      } else {
        category = 'auth';
      }
    }

    // 共通関数を呼び出し
    const result = await sendEmailInternal({
      email,
      firstName,
      emailCategory: category,
      emailType,
      planName,
      currentPlanName,
      changeDate,
    });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    return Response.json(result.data);
  } catch (error) {
    console.error('予期しないエラー:', error);
    return Response.json({ error }, { status: 500 });
  }
}
