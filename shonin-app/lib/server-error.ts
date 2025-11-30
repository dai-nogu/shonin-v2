/**
 * Server Actions用の型安全なエラーハンドリングシステム
 * 
 * - サーバーログには詳細エラーを記録
 * - クライアントには安全なエラーコードのみ送信
 * - 多言語対応メッセージはクライアント側で解決
 */

import { safeError } from '@/lib/safe-logger'

// エラータイプの定義
export type ErrorCode =
  // 認証関連
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'UNAUTHORIZED'
  // 目標関連
  | 'GOAL_FETCH_FAILED'
  | 'GOAL_ADD_FAILED'
  | 'GOAL_UPDATE_FAILED'
  | 'GOAL_DELETE_FAILED'
  | 'GOAL_COMPLETE_FAILED'
  | 'GOAL_NOT_FOUND'
  | 'GOAL_LIMIT_REACHED'
  // セッション関連
  | 'SESSION_FETCH_FAILED'
  | 'SESSION_ADD_FAILED'
  | 'SESSION_UPDATE_FAILED'
  | 'SESSION_DELETE_FAILED'
  | 'SESSION_NOT_FOUND'
  // アクティビティ関連
  | 'ACTIVITY_FETCH_FAILED'
  | 'ACTIVITY_ADD_FAILED'
  | 'ACTIVITY_UPDATE_FAILED'
  | 'ACTIVITY_DELETE_FAILED'
  | 'ACTIVITY_NOT_FOUND'
  // プロフィール関連
  | 'PROFILE_FETCH_FAILED'
  | 'PROFILE_UPDATE_FAILED'
  // サブスクリプション関連
  | 'SUBSCRIPTION_FETCH_FAILED'
  // AI関連
  | 'AI_FEEDBACK_GENERATE_FAILED'
  | 'AI_FEEDBACK_FETCH_FAILED'
  // 汎用
  | 'GENERIC_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'

/**
 * クライアントに返すエラーオブジェクト
 * - 詳細エラーは含まない
 * - エラーコードで種類を判別
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    message?: string
  ) {
    super(message || code)
    this.name = 'AppError'
    // スタックトレースをクライアントに送信しないようにする
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * クライアントに送信する安全なオブジェクトを生成
   */
  toJSON() {
    return {
      code: this.code,
      statusCode: this.statusCode,
      // messageは含めない（クライアント側で多言語対応メッセージを使用）
    }
  }
}

/**
 * Server Actions用のエラーハンドラー
 * - サーバーログには詳細を記録
 * - クライアントには安全なエラーのみ
 */
export function handleServerError(
  error: unknown,
  context: string,
  fallbackCode: ErrorCode = 'GENERIC_ERROR'
): never {
  // サーバーログに詳細を記録
  safeError(`[${context}] エラーが発生しました`, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    code: error instanceof AppError ? error.code : undefined,
    timestamp: new Date().toISOString(),
  })

  // AppErrorの場合はそのまま投げる
  if (error instanceof AppError) {
    throw error
  }

  // 一般的なErrorの場合、認証エラーかどうかチェック
  if (error instanceof Error) {
    // Supabase認証エラーを検出
    if (
      error.message.includes('JWT') ||
      error.message.includes('auth') ||
      error.message.includes('token')
    ) {
      throw new AppError('AUTH_REQUIRED', 401)
    }
  }

  // その他のエラーは汎用エラーとして処理
  throw new AppError(fallbackCode)
}

/**
 * 認証が必要なServer Actionsで使用するヘルパー
 */
export function requireAuth(): AppError {
  return new AppError('AUTH_REQUIRED', 401)
}

/**
 * データが見つからない場合のヘルパー
 */
export function notFound(code: ErrorCode): AppError {
  return new AppError(code, 404)
}

/**
 * バリデーションエラーのヘルパー
 */
export function validationError(message?: string): AppError {
  return new AppError('VALIDATION_ERROR', 400, message)
}

/**
 * エラーからErrorCodeを抽出するヘルパー
 * AppErrorの場合はそのコードを返し、それ以外の場合はundefinedを返す
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (error instanceof AppError) {
    return error.code
  }
  return undefined
}
