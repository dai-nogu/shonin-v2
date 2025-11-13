/**
 * クライアント側のエラーハンドリングヘルパー
 * 
 * ## 使用例
 * 
 * ### 基本的なエラーハンドリング
 * ```typescript
 * import { getErrorTranslationKey } from '@/lib/client-error-handler'
 * import { useTranslations } from 'next-intl'
 * 
 * const t = useTranslations()
 * 
 * try {
 *   await someAction()
 * } catch (err) {
 *   const errorKey = getErrorTranslationKey(err, 'goals.add_error')
 *   const errorMsg = t(errorKey)
 *   setError(errorMsg)
 * }
 * ```
 * 
 * ### Zodバリデーションエラー（単一エラーメッセージ）
 * ```typescript
 * import { goalSchema } from '@/lib/validations'
 * 
 * const result = goalSchema.safeParse(formData)
 * if (!result.success) {
 *   // 最初のエラーのみ表示
 *   const errorKey = getErrorTranslationKey(result.error)
 *   const errorMsg = t(errorKey) // "タイトルを入力してください" など
 *   setError(errorMsg)
 * }
 * ```
 * 
 * ### Zodバリデーションエラー（フィールド別エラー表示）
 * ```typescript
 * import { getFieldErrorsFromZod } from '@/lib/client-error-handler'
 * 
 * const result = goalSchema.safeParse(formData)
 * if (!result.success) {
 *   // 全フィールドのエラーを取得
 *   const fieldErrors = getFieldErrorsFromZod(result.error)
 *   // { title: 'validation.title.too_small', deadline: 'validation.deadline.invalid_date' }
 *   
 *   // React Hook Form などでフィールドごとにエラーを表示
 *   for (const [field, key] of Object.entries(fieldErrors)) {
 *     setError(field as any, { message: t(key) })
 *   }
 * }
 * ```
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { AppError, ErrorCode } from './server-error'

/**
 * エラーが認証エラーかどうかを判定（型安全）
 */
export function isAuthError(err: unknown): boolean {
  if (err && typeof err === 'object' && 'code' in err) {
    const appError = err as AppError
    return (
      appError.code === 'AUTH_REQUIRED' ||
      appError.code === 'AUTH_FAILED' ||
      appError.code === 'UNAUTHORIZED'
    )
  }
  return false
}

/**
 * ログインページへ安全にリダイレクト
 * - router.replaceを使用して履歴を汚さない
 * - すでにログインページにいる場合は何もしない（ループ対策）
 * 
 * @param router - Next.jsのルーターインスタンス
 * @param currentPath - 現在のパス（オプション、usePathnameから取得）
 */
export function redirectToLogin(router: AppRouterInstance, currentPath?: string | null): void {
  // すでにログインページにいる場合は何もしない（ループ対策）
  if (currentPath) {
    // /login、/ja/login、/en/loginなどを検出
    if (currentPath.includes('/login')) {
      console.warn('Already on login page, skipping redirect')
      return
    }
  }
  
  // router.replaceを使用して履歴を汚さない
  router.replace('/ja/login')
}

/**
 * エラーからエラーコードを取得
 */
export function getErrorCode(err: unknown): ErrorCode | null {
  if (err && typeof err === 'object' && 'code' in err) {
    const appError = err as AppError
    return appError.code
  }
  return null
}

/**
 * Zodバリデーションエラーの型定義
 */
interface ZodIssue {
  path: (string | number)[]
  message: string
  code: string
}

interface ZodError {
  issues: ZodIssue[]
}

/**
 * Zodバリデーションエラーかどうかを判定
 */
function isZodError(err: unknown): err is ZodError {
  return (
    err !== null &&
    typeof err === 'object' &&
    'issues' in err &&
    Array.isArray((err as ZodError).issues)
  )
}

/**
 * エラーコードから多言語対応の翻訳キーを取得
 * 
 * 優先順位:
 * 1. Zodバリデーションエラーの場合：フィールド別キー (例: 'validation.title.required')
 * 2. エラーコード自体 (例: 'AUTH_REQUIRED' -> 'errors.AUTH_REQUIRED')
 * 3. カテゴリー別のエラーキー (例: 'GOAL_FETCH_FAILED' -> 'goals.fetch_error')
 * 4. 汎用エラー ('errors.generic_retry')
 * 
 * @param err - エラーオブジェクト
 * @param fallbackKey - フォールバックキー
 * @returns 翻訳キー、またはフィールド別エラーの場合はMap<フィールド名, 翻訳キー>
 */
export function getErrorTranslationKey(err: unknown, fallbackKey?: string): string {
  // Zodバリデーションエラーの場合
  if (isZodError(err)) {
    // 最初のエラーのフィールド名とエラーコードから翻訳キーを生成
    const firstIssue = err.issues[0]
    if (firstIssue && firstIssue.path.length > 0) {
      const fieldName = firstIssue.path[0]
      const zodCode = firstIssue.code.toLowerCase()
      // 例: validation.title.required, validation.email.invalid など
      return `validation.${fieldName}.${zodCode}`
    }
    // パスがない場合は汎用バリデーションエラー
    return 'errors.VALIDATION_ERROR'
  }
  
  const errorCode = getErrorCode(err)
  
  if (errorCode) {
    // エラーコードマッピング
    const codeToKeyMap: Partial<Record<ErrorCode, string>> = {
      // 目標関連
      GOAL_FETCH_FAILED: 'goals.fetch_error',
      GOAL_ADD_FAILED: 'goals.add_error',
      GOAL_UPDATE_FAILED: 'goals.update_error',
      GOAL_DELETE_FAILED: 'goals.delete_error',
      GOAL_COMPLETE_FAILED: 'goals.complete_error',
      GOAL_NOT_FOUND: 'errors.GOAL_NOT_FOUND',
      GOAL_LIMIT_REACHED: 'errors.GOAL_LIMIT_REACHED',
      
      // セッション関連
      SESSION_FETCH_FAILED: 'sessions.fetch_error',
      SESSION_ADD_FAILED: 'sessions.add_error',
      SESSION_UPDATE_FAILED: 'sessions.update_error',
      SESSION_DELETE_FAILED: 'sessions.delete_error',
      SESSION_NOT_FOUND: 'errors.SESSION_NOT_FOUND',
      
      // アクティビティ関連
      ACTIVITY_FETCH_FAILED: 'activities.fetch_error',
      ACTIVITY_ADD_FAILED: 'activities.add_error',
      ACTIVITY_UPDATE_FAILED: 'activities.update_error',
      ACTIVITY_DELETE_FAILED: 'activities.delete_error',
      ACTIVITY_NOT_FOUND: 'errors.ACTIVITY_NOT_FOUND',
      
      // プロフィール関連
      PROFILE_FETCH_FAILED: 'profile.fetch_error',
      PROFILE_UPDATE_FAILED: 'profile.update_error',
      
      // 認証関連
      AUTH_REQUIRED: 'errors.AUTH_REQUIRED',
      AUTH_FAILED: 'errors.AUTH_FAILED',
      UNAUTHORIZED: 'errors.UNAUTHORIZED',
      
      // 汎用
      GENERIC_ERROR: 'errors.GENERIC_ERROR',
      NETWORK_ERROR: 'errors.NETWORK_ERROR',
      VALIDATION_ERROR: 'errors.VALIDATION_ERROR',
      NOT_FOUND: 'errors.notFound',
    }
    
    const mappedKey = codeToKeyMap[errorCode]
    if (mappedKey) {
      return mappedKey
    }
    
    // マッピングがない場合は errors.{CODE} を試す
    return `errors.${errorCode}`
  }
  
  // フォールバックキーまたはデフォルト
  return fallbackKey || 'errors.generic_retry'
}

/**
 * Zodバリデーションエラーから全フィールドのエラーマップを取得
 * フォーム全体のバリデーションエラーを表示する場合に使用
 * 
 * @param err - Zodエラーオブジェクト
 * @returns フィールド名をキーとする翻訳キーのMap
 * 
 * @example
 * const errors = getFieldErrorsFromZod(zodError)
 * // { title: 'validation.title.required', email: 'validation.email.invalid' }
 */
export function getFieldErrorsFromZod(err: unknown): Record<string, string> {
  if (!isZodError(err)) {
    return {}
  }
  
  const fieldErrors: Record<string, string> = {}
  
  for (const issue of err.issues) {
    if (issue.path.length > 0) {
      const fieldName = issue.path[0].toString()
      const zodCode = issue.code.toLowerCase()
      // 例: validation.title.required, validation.email.invalid など
      fieldErrors[fieldName] = `validation.${fieldName}.${zodCode}`
    }
  }
  
  return fieldErrors
}

