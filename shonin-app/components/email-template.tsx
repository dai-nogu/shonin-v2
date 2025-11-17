import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
  isNewUser: boolean;
}

export function EmailTemplate({ firstName, isNewUser }: EmailTemplateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {isNewUser ? (
        <>
          <h1 style={{ color: '#333' }}>{firstName}さん！、ようこそ</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            ご登録ありがとうございます。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            あなたの成長を見つめ、証明する旅が始まります。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            日々の努力を記録し、振り返り、成長を実感してください。
          </p>
        </>
      ) : (
        <>
          <h1 style={{ color: '#333' }}>{firstName}さん、おかえりなさい！</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            再びShoninにログインいただき、ありがとうございます。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            引き続き、あなたの努力と成長を記録していきましょう。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            私たちは、あなたの頑張りの証人です。
          </p>
        </>
      )}
      <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />
      <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>
        See the Unseen.
      </p>
    </div>
  );
}