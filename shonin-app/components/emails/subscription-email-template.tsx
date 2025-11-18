import * as React from 'react';

interface SubscriptionEmailTemplateProps {
  firstName: string;
  emailType: 'upgrade' | 'downgrade' | 'downgrade_scheduled';
  planName?: string; // 現在: 'Standard' or 'Free' | 将来: 'Premium'も追加可能
  currentPlanName?: string; // downgrade_scheduled用: 現在のプラン名
  changeDate?: string; // downgrade_scheduled用: 変更予定日
}

export function SubscriptionEmailTemplate({ 
  firstName, 
  emailType, 
  planName, 
  currentPlanName,
  changeDate 
}: SubscriptionEmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {emailType === 'upgrade' && (
        <>
          <h1 style={{ color: '#333' }}>{planName}プランへようこそ、{firstName}さん！</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {planName}プランへのアップグレード、ありがとうございます。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            これからは、さらに充実した機能をご利用いただけます：
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            <li>セッション数無制限</li>
            <li>詳細な分析レポート</li>
            <li>AIによる週次・月次フィードバック</li>
            <li>写真・動画・音声のアップロード</li>
          </ul>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {firstName}さんの更なる成長をサポートできることを楽しみにしています。
          </p>
        </>
      )}
      
      {emailType === 'downgrade_scheduled' && (
        <>
          <h1 style={{ color: '#333' }}>プラン変更のお知らせ、{firstName}さん</h1>
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
            変更後も基本機能は引き続きご利用いただけます。もし再度{currentPlanName}プランの機能が必要になった場合は、いつでもアップグレードできます。
          </p>
        </>
      )}
      
      {emailType === 'downgrade' && (
        <>
          <h1 style={{ color: '#333' }}>{planName}プランに変更されました、{firstName}さん</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            プランを{planName}プランに変更いたしました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            引き続き、基本的な機能をご利用いただけます：
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            <li>📝 セッションの記録</li>
            <li>📅 カレンダー表示</li>
            <li>🎯 目標設定と追跡</li>
          </ul>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            もし、またStandardプランの機能が必要になった場合は、いつでもアップグレードできます。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            引き続き、{firstName}さんの努力を応援しています。
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

