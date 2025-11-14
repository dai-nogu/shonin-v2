/**
 * 安全なロギングユーティリティ
 * 個人情報やトークンを自動的にマスクしてログに出力
 */

/**
 * 機密情報のキーワードリスト
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'session',
  'email', // 完全にマスク
  'phone',
  'ssn',
  'credit_card',
  'card_number',
]

/**
 * 部分的にマスクするキーワードリスト（最初と最後の数文字のみ表示）
 */
const PARTIAL_MASK_KEYS = [
  'user_id',
  'userId',
  'customer_id',
  'customerId',
  'subscription_id',
  'subscriptionId',
]

/**
 * オブジェクトから機密情報をマスクする
 */
function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    // 長い文字列（トークンの可能性）は部分的にマスク
    if (data.length > 50) {
      return `${data.substring(0, 8)}...${data.substring(data.length - 4)}`
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item))
  }

  if (typeof data === 'object') {
    const masked: any = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()

      // 完全マスク
      if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        masked[key] = '***REDACTED***'
      }
      // 部分マスク（UUIDなど）
      else if (PARTIAL_MASK_KEYS.some(partialKey => lowerKey.includes(partialKey))) {
        if (typeof value === 'string' && value.length > 8) {
          masked[key] = `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        } else {
          masked[key] = value
        }
      }
      // 再帰的にマスク
      else {
        masked[key] = maskSensitiveData(value)
      }
    }
    return masked
  }

  return data
}

/**
 * 安全な console.log
 */
export function safeLog(message: string, data?: any) {
  if (data) {
    console.log(message, maskSensitiveData(data))
  } else {
    console.log(message)
  }
}

/**
 * 安全な console.warn
 */
export function safeWarn(message: string, data?: any) {
  if (data) {
    console.warn(message, maskSensitiveData(data))
  } else {
    console.warn(message)
  }
}

/**
 * 安全な console.error
 */
export function safeError(message: string, error?: any) {
  if (error) {
    // エラーオブジェクトの場合、スタックトレースは保持
    if (error instanceof Error) {
      console.error(message, {
        name: error.name,
        message: error.message,
        stack: error.stack,
        // その他のプロパティはマスク
        ...maskSensitiveData(error),
      })
    } else {
      console.error(message, maskSensitiveData(error))
    }
  } else {
    console.error(message)
  }
}

/**
 * デバッグ用（開発環境のみ）
 */
export function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    safeLog(`[DEBUG] ${message}`, data)
  }
}

/**
 * Stripe関連のログ（price_idなどは表示、customer_idは部分マスク）
 */
export function stripeLog(message: string, data?: any) {
  if (data) {
    const safeData = {
      ...data,
      // customer_id は部分マスク
      customer_id: data.customer_id 
        ? `${data.customer_id.substring(0, 8)}...${data.customer_id.substring(data.customer_id.length - 4)}`
        : undefined,
      // subscription_id は部分マスク
      subscription_id: data.subscription_id
        ? `${data.subscription_id.substring(0, 8)}...${data.subscription_id.substring(data.subscription_id.length - 4)}`
        : undefined,
      // user_id は部分マスク
      user_id: data.user_id
        ? `${data.user_id.substring(0, 8)}...${data.user_id.substring(data.user_id.length - 4)}`
        : undefined,
      // price_id, plan, amount などは表示OK
    }
    console.log(message, safeData)
  } else {
    console.log(message)
  }
}

/**
 * ユーザーアクション用のログ（user_idは部分マスク）
 */
export function userActionLog(action: string, data?: any) {
  const safeData = data ? maskSensitiveData(data) : undefined
  safeLog(`[User Action] ${action}`, safeData)
}

