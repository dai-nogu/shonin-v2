import * as React from 'react';

interface EmailTemplateProps {
  firstName: string;
  isNewUser?: boolean;
  emailType?: 'welcome' | 'welcome_back' | 'goodbye';
}

export function EmailTemplate({ firstName, isNewUser, emailType }: EmailTemplateProps) {
  // emailTypeが指定されていない場合は、isNewUserで判定（後方互換性）
  const type = emailType || (isNewUser ? 'welcome' : 'welcome_back');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      {type === 'welcome' && (
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
      )}
      
      {type === 'welcome_back' && (
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
      
      {type === 'goodbye' && (
        <>
          <h1 style={{ color: '#333' }}>ご利用ありがとうございました、{firstName}さん</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            Shoninをご利用いただき、誠にありがとうございました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            これまでの{firstName}さんの努力の記録は、すべて削除されました。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            もし、また頑張りたいことができたときは、いつでも戻ってきてください。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
            私たちは、いつでもあなたの努力の証人になります。
          </p>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#555', marginTop: '30px' }}>
            今までの頑張り、お疲れ様でした。
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