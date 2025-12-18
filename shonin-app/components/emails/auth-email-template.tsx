import * as React from 'react';
import { getEmailMessage } from '@/lib/email-i18n';

interface AuthEmailTemplateProps {
  firstName: string;
  emailType: 'welcome' | 'welcome_back' | 'goodbye';
  locale?: 'ja' | 'en';
}

export function AuthEmailTemplate({ firstName, emailType, locale = 'en' }: AuthEmailTemplateProps) {
  const t = (key: string, replacements?: Record<string, string>) => 
    getEmailMessage(locale, key, replacements);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {emailType === 'welcome' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.auth.welcome.title', { firstName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome.line1')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome.line2')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome.line3')}
          </p>
        </>
      )}
      
      {emailType === 'welcome_back' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.auth.welcome_back.title', { firstName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome_back.line1')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome_back.line2')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.welcome_back.line3')}
          </p>
        </>
      )}
      
      {emailType === 'goodbye' && (
        <>
          <h1 style={{ color: '#333' }}>
            {t('email.auth.goodbye.title', { firstName })}
          </h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.goodbye.line1')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            {t('email.auth.goodbye.line2')}
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            {t('email.auth.goodbye.line3')}
          </p>
        </>
      )}
      
      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>
        {t('email.footer.tagline')}
      </p>
    </div>
  );
}
