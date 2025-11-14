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
 * 開発環境ではマスクなし、本番環境ではマスクあり
 */
export function safeLog(message: string, data?: any) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    // 開発環境: マスクなし（デバッグしやすい）
    console.log(`[DEV] ${message}`, data)
  } else {
    // 本番環境: マスクあり（セキュリティ優先）
    if (data) {
      console.log(message, maskSensitiveData(data))
    } else {
      console.log(message)
    }
  }
}

/**
 * 安全な console.warn
 * 開発環境ではマスクなし、本番環境ではマスクあり
 */
export function safeWarn(message: string, data?: any) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.warn(`[DEV] ${message}`, data)
  } else {
    if (data) {
      console.warn(message, maskSensitiveData(data))
    } else {
      console.warn(message)
    }
  }
}

/**
 * 安全な console.error
 * 開発環境ではマスクなし、本番環境ではマスクあり
 */
export function safeError(message: string, error?: any) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.error(`[DEV] ${message}`, error)
  } else {
    if (error) {
      // エラーオブジェクトの場合、スタックトレースは保持
      if (error instanceof Error) {
        // Error をプレーンオブジェクトに落としてからマスク
        // （循環参照を避けるため）
        const plainError: Record<string, unknown> = {}
        // enumerable な独自プロパティだけコピー
        for (const [key, value] of Object.entries(error as any)) {
          plainError[key] = value
        }
        const maskedExtra = maskSensitiveData(plainError)
        
        console.error(message, {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...maskedExtra,
        })
      } else {
        console.error(message, maskSensitiveData(error))
      }
    } else {
      console.error(message)
    }
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
 * 開発環境ではマスクなし、本番環境ではマスクあり
 * 
 * maskSensitiveData を再利用することで、
 * Stripeオブジェクトのネストした中に email や card_number が入ってきても自動的にマスク
 */
export function stripeLog(message: string, data?: any) {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (isDevelopment) {
    console.log(`[DEV STRIPE] ${message}`, data)
  } else {
    if (data) {
      // まず全体をマスク（email, card_number などが自動的にマスクされる）
      const base = maskSensitiveData(data)
      
      // Stripe IDは部分マスクに上書き（完全マスクより情報量が多い）
      const safeData = {
        ...base,
        // customer_id は部分マスク（cus_1234...5678）
        customer_id: data.customer_id && typeof data.customer_id === 'string'
          ? `${data.customer_id.substring(0, 8)}...${data.customer_id.substring(data.customer_id.length - 4)}`
          : base.customer_id,
        // subscription_id は部分マスク（sub_1234...5678）
        subscription_id: data.subscription_id && typeof data.subscription_id === 'string'
          ? `${data.subscription_id.substring(0, 8)}...${data.subscription_id.substring(data.subscription_id.length - 4)}`
          : base.subscription_id,
        // user_id は部分マスク（uuid-123...5678）
        user_id: data.user_id && typeof data.user_id === 'string'
          ? `${data.user_id.substring(0, 8)}...${data.user_id.substring(data.user_id.length - 4)}`
          : base.user_id,
        // price_id, plan, amount, status などは maskSensitiveData で既に処理済み
      }
      console.log(message, safeData)
    } else {
      console.log(message)
    }
  }
}

/**
 * ユーザーアクション用のログ（user_idは部分マスク）
 */
export function userActionLog(action: string, data?: any) {
  const safeData = data ? maskSensitiveData(data) : undefined
  safeLog(`[User Action] ${action}`, safeData)
}

