import enMessages from '@/messages/en.json';
import jaMessages from '@/messages/ja.json';

type Messages = typeof jaMessages;
type Locale = 'ja' | 'en';

const messages: Record<Locale, Messages> = {
  ja: jaMessages,
  en: enMessages,
};

/**
 * メールテンプレート用の翻訳関数
 * @param locale ロケール ('ja' | 'en')
 * @param key メッセージキー
 * @param replacements 置換用のオブジェクト
 */
export function getEmailMessage(
  locale: Locale,
  key: string,
  replacements?: Record<string, string>
): string {
  const messageObj = messages[locale] || messages.en;
  
  // キーを分割してネストされたオブジェクトから値を取得
  const keys = key.split('.');
  let value: any = messageObj;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  if (typeof value !== 'string') {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
  
  // 置換処理
  if (replacements) {
    return Object.entries(replacements).reduce((text, [replaceKey, replaceValue]) => {
      return text.replace(new RegExp(`\\{${replaceKey}\\}`, 'g'), replaceValue);
    }, value);
  }
  
  return value;
}
