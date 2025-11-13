/**
 * クライアント側のエラーハンドリングヘルパー
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
 * エラーコードから多言語対応の翻訳キーを取得
 * 
 * 優先順位:
 * 1. エラーコード自体 (例: 'AUTH_REQUIRED' -> 'errors.AUTH_REQUIRED')
 * 2. カテゴリー別のエラーキー (例: 'GOAL_FETCH_FAILED' -> 'goals.fetch_error')
 * 3. 汎用エラー ('errors.generic_retry')
 */
export function getErrorTranslationKey(err: unknown, fallbackKey?: string): string {
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

