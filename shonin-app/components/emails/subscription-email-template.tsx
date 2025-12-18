import * as React from 'react';
import { getEmailMessage } from '@/lib/email-i18n';

interface SubscriptionEmailTemplateProps {
  firstName: string;
  emailType: 'upgrade' | 'downgrade' | 'downgrade_scheduled';
  planName?: string; // アップグレード先/ダウングレード先のプラン名
  previousPlanName?: string; // アップグレード元/ダウングレード元のプラン名
  currentPlanName?: string; // downgrade_scheduled用: 現在のプラン名
  changeDate?: string; // downgrade_scheduled用: 変更予定日
  locale?: 'ja' | 'en';
}

export function SubscriptionEmailTemplate({ 
  firstName, 
  emailType, 
  planName = 'Standard', 
  previousPlanName,
  currentPlanName,
  changeDate,
  locale = 'ja'
}: SubscriptionEmailTemplateProps) {
  const t = (key: string, replacements?: Record<string, string>) => 
    getEmailMessage(locale, key, replacements);

  // プラン名を小文字に変換してキーとして使用
  const planKey = planName.toLowerCase();
  
  // プランの説明を取得
  const getPlanDescription = () => {
    return t(`email.subscription.plan_features.${planKey}.description`);
  };
  
  // プランの機能リストを取得
  const getPlanFeatures = () => {
    const features = [];
    let index = 1;
    while (true) {
      const featureKey = `email.subscription.plan_features.${planKey}.feature${index}`;
      const feature = t(featureKey);
      if (feature === featureKey) break; // 翻訳が見つからない場合は終了
      features.push(feature);
      index++;
    }
    return features;
  };
  
  const planDescription = getPlanDescription();
  const planFeatures = getPlanFeatures();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {emailType === 'upgrade' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.subscription.upgrade.title', { firstName, planName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.upgrade.line1', { planName })}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.upgrade.line2', { description: planDescription })}
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            {planFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            {t('email.subscription.upgrade.line3', { firstName })}
          </p>
        </>
      )}
      
      {emailType === 'downgrade_scheduled' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.subscription.downgrade_scheduled.title', { firstName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.downgrade_scheduled.line1')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', fontWeight: 'bold' }}>
            {t('email.subscription.downgrade_scheduled.line2', { changeDate: changeDate || '', planName })}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.downgrade_scheduled.line3', { currentPlanName: currentPlanName || '' })}
          </p>
        </>
      )}
      
      {emailType === 'downgrade' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.subscription.downgrade.title', { firstName, planName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.downgrade.line1', { planName })}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.subscription.downgrade.line2', { description: planDescription })}
          </p>
          <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#555' }}>
            {planFeatures.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          {planName !== 'Free' && (
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
              {t('email.subscription.downgrade.line3_non_free')}
            </p>
          )}
          {planName === 'Free' && previousPlanName && (
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
              {t('email.subscription.downgrade.line3_free', { previousPlanName })}
            </p>
          )}
        </>
      )}
      
      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>
        {t('email.footer.tagline')}
      </p>
    </div>
  );
}
