/**
 * CSRF保護ユーティリティ
 * Cookie ベースの API エンドポイントに対する CSRF 攻撃を防ぐ
 */

import { NextRequest } from 'next/server'

/**
 * 許可されたオリジンのリスト
 */
const ALLOWED_ORIGINS = [
  process.env.BASE_URL,
  'http://localhost:3000', // 開発環境
  'http://127.0.0.1:3000', // 開発環境
].filter(Boolean) as string[]

/**
 * Origin/Referer ヘッダーをチェックして CSRF 攻撃を防ぐ
 * 
 * @param request - Next.js リクエストオブジェクト
 * @returns CSRF チェックが通過したか
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   if (!validateOrigin(request)) {
 *     return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
 *   }
 *   // ... 処理を続行
 * }
 * ```
 */
export function validateOrigin(request: NextRequest): boolean {
  // GET リクエストは CSRF の対象外（副作用がないため）
  if (request.method === 'GET') {
    return true
  }

  // Origin ヘッダーをチェック（優先）
  const origin = request.headers.get('origin')
  if (origin) {
    return isAllowedOrigin(origin)
  }

  // Origin がない場合は Referer をチェック（フォールバック）
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      return isAllowedOrigin(refererOrigin)
    } catch {
      // Referer が不正な URL の場合は拒否
      return false
    }
  }

  // Origin も Referer もない場合は拒否
  // （通常のブラウザリクエストには必ずどちらかが含まれる）
  return false
}

/**
 * オリジンが許可リストに含まれているかチェック
 */
function isAllowedOrigin(origin: string): boolean {
  // 完全一致チェック
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true
  }

  // 本番環境のVercelプレビューURLを許可
  // 例: https://no-name-yet-app-*.vercel.app
  if (origin.match(/^https:\/\/no-name-yet-app-[a-z0-9-]+\.vercel\.app$/)) {
    return true
  }

  return false
}

/**
 * CSRF トークンを生成（将来的な拡張用）
 * 
 * 現在は Origin/Referer チェックで十分ですが、
 * より強固な保護が必要な場合はトークンベースの CSRF 対策を追加できます
 */
export function generateCsrfToken(): string {
  // 将来的な実装用のプレースホルダー
  throw new Error('CSRF token generation not implemented yet')
}

/**
 * CSRF トークンを検証（将来的な拡張用）
 */
export function validateCsrfToken(token: string): boolean {
  // 将来的な実装用のプレースホルダー
  throw new Error('CSRF token validation not implemented yet')
}

