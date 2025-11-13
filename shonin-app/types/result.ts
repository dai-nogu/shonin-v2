/**
 * Result型 - 操作結果を型安全に表現
 * 
 * Server ActionsやカスタムHooksの返り値を統一し、
 * 呼び出し側での扱いを簡単かつ型安全にする
 */

/**
 * 成功時の結果
 */
export interface Success<T> {
  success: true
  data: T
}

/**
 * 失敗時の結果
 */
export interface Failure {
  success: false
  error: string
  errorCode?: string
}

/**
 * Result型 - 成功または失敗を表現
 */
export type Result<T> = Success<T> | Failure

/**
 * ヘルパー関数：成功結果を作成
 */
export function success<T>(data: T): Success<T> {
  return {
    success: true,
    data,
  }
}

/**
 * ヘルパー関数：失敗結果を作成
 */
export function failure(error: string, errorCode?: string): Failure {
  return {
    success: false,
    error,
    errorCode,
  }
}

/**
 * void操作用のResult型（データが不要な場合）
 */
export type VoidResult = Result<void>

/**
 * ヘルパー関数：void操作の成功結果を作成
 */
export function voidSuccess(): Success<void> {
  return success(undefined)
}

