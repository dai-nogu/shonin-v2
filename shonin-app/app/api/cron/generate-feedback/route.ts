import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { analyzeSessionData, type RawSessionData } from '@/lib/session-analyzer'
import { generatePrompts, type PromptGenerationConfig } from '@/lib/prompt-generator'
import Anthropic from '@anthropic-ai/sdk'
import { safeWarn, safeError, safeLog } from '@/lib/safe-logger'

// Vercel Cron Jobから呼ばれる想定
// ヘッダーにAuthorization: Bearer <CRON_SECRET>を含める必要があります

/**
 * 週次・月次フィードバックを自動生成するCron Job
 * 
 * Vercel Cron設定例（vercel.json）:
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/generate-feedback",
 *       "schedule": "0 9 * * 1" // 毎週月曜日9:00（週次）
 *     },
 *     {
 *       "path": "/api/cron/generate-feedback?type=monthly",
 *       "schedule": "0 9 1 * *" // 毎月1日9:00（月次）
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Cron Job認証チェック
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // フィードバックタイプ（デフォルト: weekly）
    const searchParams = request.nextUrl.searchParams
    const feedbackType = searchParams.get('type') === 'monthly' ? 'monthly' : 'weekly'

    // Supabaseクライアント（サービスロールキー使用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 対象期間を計算
    const { periodStart, periodEnd } = calculatePeriod(feedbackType)

    // すべてのユーザーを取得（アクティブなユーザーのみ）
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    const results = {
      total: users.users.length,
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 各ユーザーに対してフィードバックを生成
    for (const user of users.users) {
      try {
        // このユーザーの対象期間のセッションを取得（復号化ビューを使用）
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions_reflections_decrypted')
          .select(`
            id,
            duration,
            session_date,
            mood,
            notes,
            location,
            goal_id,
            activity_id,
            activities!inner(name),
            goals(
              id,
              title,
              description,
              deadline,
              target_duration,
              weekday_hours,
              weekend_hours,
              current_value,
              status
            )
          `)
          .eq('user_id', user.id)
          .gte('session_date', periodStart)
          .lte('session_date', periodEnd)
          .order('session_date', { ascending: false })

        if (sessionsError) {
          results.failed++
          results.errors.push(`User ${user.id}: ${sessionsError.message}`)
          continue
        }

        // セッションがない場合はスキップ
        if (!sessions || sessions.length === 0) {
          results.skipped++
          continue
        }

        // 既存のフィードバックをチェック（重複防止）
        const { data: existingFeedback } = await supabase
          .from('ai_feedback')
          .select('id')
          .eq('user_id', user.id)
          .eq('feedback_type', feedbackType)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .single()

        if (existingFeedback) {
          results.skipped++
          continue
        }

        // 過去のフィードバックを取得（より良い分析のため）
        const { data: pastFeedbacks } = await supabase
          .from('ai_feedback_decrypted')
          .select('content, period_start, period_end, feedback_type, created_at')
          .eq('user_id', user.id)
          .eq('feedback_type', feedbackType)
          .order('created_at', { ascending: false })
          .limit(3)

        // Anthropic APIでフィードバックを生成（既存ロジック使用）
        const feedbackContent = await generateAIFeedbackWithRetry(
          sessions,
          feedbackType,
          periodStart,
          periodEnd,
          pastFeedbacks || [],
          user.user_metadata?.locale || 'ja'
        )

        // フィードバックを保存
        // Note: Cron Jobではサービスロールを使用しているため、
        // insert_encrypted_feedback関数は使用できない（auth.uid()がnull）
        // 代わりに直接挿入する（暗号化は手動で行う）
        
        // pgcryptoで暗号化するためのクエリを実行
        const { data: encryptResult, error: encryptError } = await supabase.rpc('pgp_sym_encrypt', {
          data: feedbackContent,
          psw: user.id
        })

        if (encryptError) {
          safeError(`暗号化エラー (User ${user.id})`, encryptError)
          results.failed++
          results.errors.push(`User ${user.id}: Encryption failed - ${encryptError.message}`)
          continue
        }

        const { error: insertError } = await supabase
          .from('ai_feedback')
          .insert({
            user_id: user.id,
            feedback_type: feedbackType,
            content_encrypted: encryptResult,
            period_start: periodStart,
            period_end: periodEnd,
            is_read: false
          })

        if (insertError) {
          safeError(`挿入エラー (User ${user.id})`, insertError)
          results.failed++
          results.errors.push(`User ${user.id}: ${insertError.message}`)
          continue
        }

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      type: feedbackType,
      period: { start: periodStart, end: periodEnd },
      results
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * 対象期間を計算
 */
function calculatePeriod(type: 'weekly' | 'monthly'): { 
  periodStart: string
  periodEnd: string 
} {
  const today = new Date()
  
  if (type === 'weekly') {
    // 先週の月曜日から日曜日
    const lastMonday = new Date(today)
    lastMonday.setDate(today.getDate() - today.getDay() - 6) // 先週の月曜日
    
    const lastSunday = new Date(lastMonday)
    lastSunday.setDate(lastMonday.getDate() + 6) // 先週の日曜日
    
    return {
      periodStart: lastMonday.toISOString().split('T')[0],
      periodEnd: lastSunday.toISOString().split('T')[0]
    }
  } else {
    // 先月の1日から末日
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    return {
      periodStart: lastMonth.toISOString().split('T')[0],
      periodEnd: lastMonthEnd.toISOString().split('T')[0]
    }
  }
}

/**
 * AIフィードバックを生成（リトライロジック付き）
 */
async function generateAIFeedbackWithRetry(
  sessions: any[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  pastFeedbacks: any[] = [],
  locale: string = 'ja'
): Promise<string> {
  const maxRetries = 3
  const maxChars = locale === 'en' 
    ? (periodType === 'weekly' ? 800 : 1300) 
    : (periodType === 'weekly' ? 500 : 800)
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const feedback = await generateAIFeedback(sessions, periodType, periodStart, periodEnd, pastFeedbacks, attempt, locale)
      const charCount = feedback.length
      
      safeLog(`Attempt ${attempt}: Generated ${charCount} characters`)
      
      if (charCount <= maxChars) {
        return feedback
      }
      
      if (attempt === maxRetries) {
        safeLog(`Max retries reached. Returning as is.`)
        return feedback
      }
      
      safeLog(`Attempt ${attempt} exceeded ${maxChars} characters. Retrying...`)
      
    } catch (error) {
      safeError(`Attempt ${attempt} failed`, error)
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
  
  throw new Error('Failed to generate feedback')
}

/**
 * Anthropic APIでフィードバックを生成
 */
async function generateAIFeedback(
  sessions: any[],
  periodType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  pastFeedbacks: any[] = [],
  attempt: number = 1,
  locale: string = 'ja'
): Promise<string> {
  try {
    const analyzedData = analyzeSessionData(
      sessions as RawSessionData[],
      periodType,
      periodStart,
      periodEnd
    )
    
    const promptConfig: PromptGenerationConfig = {
      locale,
      attempt,
      pastFeedbacksCount: pastFeedbacks.length
    }
    
    const { systemPrompt, userPrompt, maxTokens } = generatePrompts(analyzedData, promptConfig)

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const model = periodType === 'weekly' 
      ? 'claude-sonnet-4-20250514'
      : 'claude-opus-4-20250514'

    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        },
        {
          role: 'assistant',
          content: '{'
        }
      ],
    })

    let content = message.content[0]?.type === 'text' 
      ? message.content[0].text 
      : ''
    
    if (content) {
      content = '{' + content
    } else {
      return JSON.stringify({ overview: getFallbackMessage('default', locale, periodType) })
    }

    try {
      const feedbackData = JSON.parse(content)
      return JSON.stringify(feedbackData)
    } catch (parseError) {
      safeWarn('JSON Parse failed', parseError)
      const fallbackJson = {
        overview: content,
        error: "format_error"
      }
      return JSON.stringify(fallbackJson)
    }

  } catch (error) {
    safeError('Claude API エラー', error)
    
    if (error instanceof Anthropic.APIError && error.status === 429) {
      const msg = getFallbackMessage('rate_limit', locale, periodType)
      return JSON.stringify({ overview: msg })
    }
    
    const msg = getFallbackMessage('error', locale, periodType)
    return JSON.stringify({ overview: msg })
  }
}

/**
 * フォールバックメッセージを取得
 */
function getFallbackMessage(
  type: 'rate_limit' | 'default' | 'truncated' | 'error',
  locale: string,
  periodType: 'weekly' | 'monthly'
): string {
  const messages = {
    ja: {
      rate_limit: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。フィードバック生成に時間がかかっています。少し時間をおいて再度お試しください。`,
      default: `無理しなくて大丈夫です。${periodType === 'weekly' ? '今週も一緒に頑張りましょう。' : '今月も一緒に頑張りましょう。'}`,
      truncated: `${periodType === 'weekly' ? '先週' : '先月'}の分析中にエラーが発生しましたが、あなたの努力は記録されています。`,
      error: `${periodType === 'weekly' ? '先週' : '先月'}の頑張りを見ていました。今、フィードバックの準備に少し時間がかかっています。`
    },
    en: {
      rate_limit: `Feedback generation is taking some time. Please try again later.`,
      default: `Take your time, no pressure.`,
      truncated: `An error occurred during analysis, but your efforts are recorded.`,
      error: `Feedback preparation is taking a bit of time right now.`
    }
  }
  
  const localeMessages = (messages as any)[locale] || messages.ja
  return localeMessages[type]
}

