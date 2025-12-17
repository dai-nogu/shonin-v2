import * as React from 'react';

interface SubscriptionEmailTemplateProps {
  firstName: string;
  emailType: 'upgrade' | 'downgrade' | 'downgrade_scheduled';
  planName?: string; // アップグレード先/ダウングレード先のプラン名
  previousPlanName?: string; // アップグレード元/ダウングレード元のプラン名
  currentPlanName?: string; // downgrade_scheduled用: 現在のプラン名
  changeDate?: string; // downgrade_scheduled用: 変更予定日
}

// プラン別の機能リスト
const PLAN_FEATURES: Record<string, { features: string[]; description: string }> = {
  Starter: {
    description: '基本的な機能であなたを見守ります。',
    features: [
      '① 孤独な努力の記録',
      '② 当月のみのカレンダー表示',
      '③ 1つの目標設定',
    ],
  },
  Standard: {
    description: '基本的な機能 + Shoninからの手紙であなたを見守ります。',
    features: [
      '① 孤独な努力の記録',
      '② 全期間のカレンダー表示',
      '③ 3つの目標設定',
      '④ 月1回のShoninからの手紙',
    ],
  },
  Premium: {
    description: 'Shoninの持てる全てであなたを見守ります。',
    features: [
      '① 孤独な努力の記録',
      '② 全期間のカレンダー表示',
      '③ 無制限の目標設定',
      '④ 週1回、月1回のShoninからの手紙',
    ],
  },
  Free: {
    description: '静寂の中で孤独な努力を続けましょう。',
    features: [
      '① 孤独な努力の記録',
      '② 直近1週間のカレンダー表示',
    ],
  },
};

export function SubscriptionEmailTemplate({ 
  firstName, 
  emailType, 
  planName = 'Standard', 
  previousPlanName,
  currentPlanName,
  changeDate 
}: SubscriptionEmailTemplateProps) {
  const planFeatures = PLAN_FEATURES[planName] || PLAN_FEATURES.Standard;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {emailType === 'upgrade' && (
        <>
          <h1 style={{ color: '#333' }}>{firstName}さん、{planName}プランへようこそ</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {planName}プランへのアップグレードが完了しました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {planFeatures.description}：
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            {planFeatures.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            世界中の同志と共に孤独な努力を続けましょう。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            引き続き、{firstName}さんの努力を見守っています。
          </p>
        </>
      )}
      
      {emailType === 'downgrade_scheduled' && (
        <>
          <h1 style={{ color: '#333' }}>{firstName}さん、プラン変更のお知らせです</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            サブスクリプションのキャンセルを承りました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', fontWeight: 'bold' }}>
            {changeDate}に{planName}プランに変更されます。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            それまでは引き続き、現在の{currentPlanName}プランの全機能をご利用いただけます。
          </p>
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#888' }}>
            変更後も基本機能は引き続きご利用いただけます。もし再度{currentPlanName}プランが必要になった場合は、いつでもアップグレードできます。
          </p>
        </>
      )}
      
      {emailType === 'downgrade' && (
        <>
          <h1 style={{ color: '#333' }}>{firstName}さん、{planName}プランに変更されました</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            プランを{planName}プランに変更いたしました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {planFeatures.description}：
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            {planFeatures.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          {planName !== 'Free' && (
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
              どうしても一人に耐えられなくなったら、いつでも戻ってきてくださいね。
            </p>
          )}
          {planName === 'Free' && previousPlanName && (
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
              再度{previousPlanName}プランが必要になった場合は、いつでもアップグレードできます。
            </p>
          )}
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            引き続き、{firstName}さんの努力を見守っています。
          </p>
        </>
      )}
      
      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>
        Be a witness to your growth.
      </p>
    </div>
  );
}

