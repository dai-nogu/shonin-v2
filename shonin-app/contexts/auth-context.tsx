"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { clientLogger } from '@/lib/client-logger'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const MAX_RETRY_COUNT = 3

  // セッションのリフレッシュ処理（エラーハンドリング＆リトライ機能付き）
  const refreshSession = useCallback(async (retryCount = 0) => {
    try {
      clientLogger.log('セッションのリフレッシュを実行中...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        throw error
      }

      if (data?.session) {
        clientLogger.log('セッションのリフレッシュが成功しました')
        setSession(data.session)
        setUser(data.session.user)
        retryCountRef.current = 0 // リトライカウントをリセット
        
        // 次のリフレッシュタイマーをセット
        scheduleTokenRefresh(data.session)
      }
    } catch (error) {
      clientLogger.error('セッションのリフレッシュに失敗:', error)
      
      // リトライロジック
      if (retryCount < MAX_RETRY_COUNT) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000) // 指数バックオフ（最大10秒）
        clientLogger.log(`${retryDelay}ms後にリトライします... (${retryCount + 1}/${MAX_RETRY_COUNT})`)
        
        setTimeout(() => {
          refreshSession(retryCount + 1)
        }, retryDelay)
      } else {
        clientLogger.error('セッションのリフレッシュが最大リトライ回数を超えました')
        // 最大リトライ回数を超えた場合は、ユーザーに再ログインを促す
        // ここでトーストやモーダルを表示することもできます
      }
    }
  }, [supabase])

  // トークンの事前更新スケジュールを設定（75%経過時点）
  const scheduleTokenRefresh = useCallback((session: Session) => {
    // 既存のタイマーをクリア
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    // セッションの有効期限を取得
    const expiresAt = session.expires_at
    if (!expiresAt) return

    const expiresAtMs = expiresAt * 1000 // 秒 -> ミリ秒
    const now = Date.now()
    const timeUntilExpiry = expiresAtMs - now

    // 有効期限の75%経過時点でリフレッシュ
    const refreshTime = timeUntilExpiry * 0.75

    if (refreshTime > 0) {
      clientLogger.log(`${Math.round(refreshTime / 1000 / 60)}分後にトークンをリフレッシュします`)
      
      refreshTimerRef.current = setTimeout(() => {
        refreshSession()
      }, refreshTime)
    } else {
      // すでに75%を超えている場合は即座にリフレッシュ
      clientLogger.log('セッションの有効期限が近いため、即座にリフレッシュします')
      refreshSession()
    }
  }, [refreshSession])

  useEffect(() => {
    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // 初期セッションがある場合、リフレッシュをスケジュール
      if (session) {
        scheduleTokenRefresh(session)
      }
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // セッションが更新されたら、リフレッシュをスケジュール
      if (session) {
        scheduleTokenRefresh(session)
      }
    })

    return () => {
      subscription.unsubscribe()
      // タイマーをクリア
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [supabase, scheduleTokenRefresh])

  // Google OAuth認証（エラーハンドリング強化版）
  const signInWithGoogle = async () => {
    try {
      // 現在のロケールを取得
      const pathname = window.location.pathname
      const locale = pathname.split('/')[1] || 'ja'
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback?locale=${locale}`,
          queryParams: {
            // リフレッシュトークンを取得するために必要
            access_type: 'offline',
            // ユーザーに毎回同意を求める（リフレッシュトークンの確実な取得）
            prompt: 'consent',
          }
        }
      })
      
      if (error) {
        clientLogger.error('Google認証エラー:', error)
        throw error
      }
    } catch (error) {
      clientLogger.error('ログイン処理中にエラーが発生:', error)
      throw error
    }
  }

  // ログアウト
  const signOut = async () => {
    try {
      // リフレッシュタイマーをクリア
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      
      // ローカルストレージをクリア
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app-current-page')
        localStorage.removeItem('app-calendar-view-mode')
        localStorage.removeItem('app-user-name')
        localStorage.removeItem('app-user-email')
        localStorage.removeItem('app-auth')
        localStorage.removeItem('app-goal-reminders')
        // 訪問履歴をクリア（古い形式と新しい形式両方）
        localStorage.removeItem('lastVisitDate')
        localStorage.removeItem('lastVisit_morning')
        localStorage.removeItem('lastVisit_afternoon')
        localStorage.removeItem('lastVisit_evening')
      }
      
      clientLogger.log('ログアウトが完了しました')
    } catch (error) {
      clientLogger.error('ログアウト処理中にエラーが発生:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 