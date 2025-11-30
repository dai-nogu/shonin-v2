/**
 * XSS対策: サニタイズ関数
 * 
 * すべてのユーザー入力に対してサーバー側で適用することで、
 * <script>タグなどの悪意あるコードがそのまま実行されることを防ぐ
 */

/**
 * XSS対策用の特殊文字変換マップ
 * HTML/JavaScript で解釈される可能性のある文字をエスケープ
 */
const XSS_ESCAPE_MAP: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '&': '&amp;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * XSS対策: 特殊文字をHTMLエンティティにエスケープ
 * 
 * @param input - サニタイズする文字列
 * @returns エスケープされた安全な文字列
 * 
 * @example
 * sanitizeXss('<script>alert("XSS")</script>')
 * // => '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 */
export function sanitizeXss(input: string): string {
  if (!input) return input;
  
  return input.replace(/[<>"'&/`=]/g, (char) => XSS_ESCAPE_MAP[char] || char);
}

/**
 * XSS対策: null許容版
 * 
 * @param input - サニタイズする文字列（null/undefined可）
 * @returns エスケープされた安全な文字列、またはnull
 */
export function sanitizeXssNullable(input: string | null | undefined): string | null {
  if (input === null || input === undefined) return null;
  return sanitizeXss(input);
}

