"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase'
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

  useEffect(() => {
    // 初期セッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更を監視（Supabaseが自動的にセッションをリフレッシュします）
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Google OAuth認証
  const signInWithGoogle = async () => {
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
      throw error
    }
  }

  // ログアウト
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    
    // ローカルストレージをクリア
    if (typeof window !== 'undefined') {
      // アプリケーション固有のキーを削除
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
      
      // Supabaseのセッション関連のキーを全て削除
      // session_ で始まる全てのキーを削除
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('session_') || key.startsWith('sb-') || key.startsWith('supabase.'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // その他のShonin関連のキーも削除
      localStorage.removeItem('shonin-calendar-view-mode')
      localStorage.removeItem('shonin-timezone')
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