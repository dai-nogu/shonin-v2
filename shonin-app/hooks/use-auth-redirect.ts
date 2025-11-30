"use client"

import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { Result } from '@/types/result'
import { redirectToLogin } from '@/lib/client-error-handler'

/**
 * 認証エラー時のリダイレクトを処理するフック
 * 
 * フック側では認証エラーを返すだけにし、
 * コンポーネント側でこのフックを使ってリダイレクトを処理する。
 * これにより責務が分離され、テスト性が向上する。
 */
export function useAuthRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  
  /**
   * Result型のエラーが認証エラーかチェックし、必要ならリダイレクト
   * @param result - Server ActionやフックからのResult
   * @returns true: 認証エラーでリダイレクトした, false: 認証エラーではない
   */
  const handleAuthError = useCallback(<T>(result: Result<T>): boolean => {
    if (!result.success && result.errorCode === 'AUTH_REQUIRED') {
      redirectToLogin(router, pathname)
      return true
    }
    return false
  }, [router, pathname])
  
  return { handleAuthError }
}

