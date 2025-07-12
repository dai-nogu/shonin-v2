/**
 * タイムゾーン関連のユーティリティ関数
 */

// 主要なタイムゾーンのリスト（国名ベース）
export const TIMEZONES = [
  { value: 'Asia/Tokyo', label: '日本 (JST)', offset: '+09:00' },
  { value: 'America/New_York', label: 'アメリカ東部 (EST)', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'アメリカ西部 (PST)', offset: '-08:00' },
  { value: 'America/Chicago', label: 'アメリカ中部 (CST)', offset: '-06:00' },
  { value: 'America/Denver', label: 'アメリカ山地 (MST)', offset: '-07:00' },
  { value: 'Europe/London', label: 'イギリス (GMT)', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'フランス (CET)', offset: '+01:00' },
  { value: 'Europe/Berlin', label: 'ドイツ (CET)', offset: '+01:00' },
  { value: 'Asia/Shanghai', label: '中国 (CST)', offset: '+08:00' },
  { value: 'Asia/Seoul', label: '韓国 (KST)', offset: '+09:00' },
  { value: 'Asia/Singapore', label: 'シンガポール (SGT)', offset: '+08:00' },
  { value: 'Asia/Hong_Kong', label: '香港 (HKT)', offset: '+08:00' },
  { value: 'Asia/Bangkok', label: 'タイ (ICT)', offset: '+07:00' },
  { value: 'Asia/Dubai', label: 'UAE (GST)', offset: '+04:00' },
  { value: 'Asia/Kolkata', label: 'インド (IST)', offset: '+05:30' },
  { value: 'Australia/Sydney', label: 'オーストラリア東部 (AEST)', offset: '+10:00' },
  { value: 'Australia/Melbourne', label: 'オーストラリア南東部 (AEST)', offset: '+10:00' },
  { value: 'Pacific/Auckland', label: 'ニュージーランド (NZST)', offset: '+12:00' },
  { value: 'UTC', label: '協定世界時 (UTC)', offset: '+00:00' },
] as const

/**
 * ブラウザのタイムゾーンを自動検出
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    console.warn('タイムゾーンの自動検出に失敗しました:', error)
    return 'Asia/Tokyo' // デフォルト値
  }
}

/**
 * 指定したタイムゾーンでの現在時刻を取得
 * 注意: この関数は単純に現在時刻を返すだけで、タイムゾーン変換は行いません
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return new Date()
}

/**
 * 日付を指定したタイムゾーンに変換
 * 注意: この関数は表示用途のみで、実際の時刻変換は行いません
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  // 実際のタイムゾーン変換は不要
  // 時刻の表示はtoLocaleString等で行う
  return date
}

/**
 * タイムゾーンのオフセット（分）を取得
 * 注意: この関数は使用されていないため、0を返します
 */
export function getTimezoneOffset(timezone: string): number {
  return 0
}

/**
 * 指定したタイムゾーンでの日付文字列を取得 (YYYY-MM-DD形式)
 */
export function getDateStringInTimezone(date: Date, timezone: string): string {
  try {
    // タイムゾーンを考慮した日付文字列を直接取得
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    return formatter.format(date)
  } catch (error) {
    console.warn('タイムゾーン日付文字列の取得に失敗しました:', error)
    return date.toISOString().split('T')[0]
  }
}

/**
 * 指定したタイムゾーンでの時刻文字列を取得
 */
export function getTimeStringInTimezone(date: Date, timezone: string, format: '12h' | '24h' = '24h'): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === '12h'
    }
    return date.toLocaleTimeString('ja-JP', options)
  } catch (error) {
    console.warn('タイムゾーン時刻文字列の取得に失敗しました:', error)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: format === '12h'
    })
  }
}

/**
 * 指定したタイムゾーンでの日付時刻文字列を取得
 */
export function getDateTimeStringInTimezone(date: Date, timezone: string): string {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }
    return date.toLocaleString('ja-JP', options)
  } catch (error) {
    console.warn('タイムゾーン日付時刻文字列の取得に失敗しました:', error)
    return date.toLocaleString('ja-JP')
  }
}

/**
 * 指定したタイムゾーンでの週の開始日（月曜日）を取得
 */
export function getWeekStartInTimezone(date: Date, timezone: string): Date {
  // タイムゾーンを考慮した日付から週の開始日を計算
  const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const day = dateInTimezone.getDay()
  const diff = dateInTimezone.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を週の開始とする
  const weekStart = new Date(dateInTimezone)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/**
 * 指定したタイムゾーンでの月の開始日を取得
 */
export function getMonthStartInTimezone(date: Date, timezone: string): Date {
  // タイムゾーンを考慮した日付から月の開始日を計算
  const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const monthStart = new Date(dateInTimezone)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

/**
 * 指定したタイムゾーンでの日付の開始時刻（00:00:00）を取得
 */
export function getDayStartInTimezone(date: Date, timezone: string): Date {
  // タイムゾーンを考慮した日付から日の開始時刻を計算
  const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const dayStart = new Date(dateInTimezone)
  dayStart.setHours(0, 0, 0, 0)
  return dayStart
}

/**
 * 指定したタイムゾーンでの日付の終了時刻（23:59:59）を取得
 */
export function getDayEndInTimezone(date: Date, timezone: string): Date {
  // タイムゾーンを考慮した日付から日の終了時刻を計算
  const dateInTimezone = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  const dayEnd = new Date(dateInTimezone)
  dayEnd.setHours(23, 59, 59, 999)
  return dayEnd
}

/**
 * 連続日数を計算（タイムゾーン考慮）
 */
export function calculateStreakDays(sessions: Array<{ startTime: Date }>, timezone: string): number {
  if (sessions.length === 0) return 0

  // セッションを日付ごとにグループ化（指定したタイムゾーンで）
  const sessionsByDate = new Map<string, boolean>()
  sessions.forEach(session => {
    const dateKey = getDateStringInTimezone(session.startTime, timezone)
    sessionsByDate.set(dateKey, true)
  })

  // 今日から遡って連続日数を計算
  const today = new Date()
  const todayKey = getDateStringInTimezone(today, timezone)
  
  // 今日にセッションがあるかチェック
  const hasTodaySession = sessionsByDate.has(todayKey)
  
  let streakCount = 0
  for (let i = 0; i < 365; i++) { // 最大365日まで遡る
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateKey = getDateStringInTimezone(checkDate, timezone)
    
    if (sessionsByDate.has(dateKey)) {
      streakCount++
    } else {
      // 今日（i=0）でセッションがない場合は、昨日から連続記録を確認
      if (i === 0 && !hasTodaySession) {
        continue // 今日をスキップして昨日から計算
      } else {
        // 連続が途切れた
        break
      }
    }
  }
  
  return streakCount
}

/**
 * 指定したタイムゾーンでの今日のセッションをフィルタリング
 */
export function getTodaySessionsInTimezone<T extends { startTime: Date }>(
  sessions: T[], 
  timezone: string
): T[] {
  const today = new Date()
  const todayString = getDateStringInTimezone(today, timezone)
  
  return sessions.filter(session => {
    const sessionDateString = getDateStringInTimezone(session.startTime, timezone)
    return sessionDateString === todayString
  })
}

/**
 * 指定したタイムゾーンでの今週のセッションをフィルタリング
 */
export function getWeekSessionsInTimezone<T extends { startTime: Date }>(
  sessions: T[], 
  timezone: string
): T[] {
  const today = new Date()
  const weekStart = getWeekStartInTimezone(today, timezone)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  // 週の開始日と終了日の日付文字列を取得
  const weekStartString = getDateStringInTimezone(weekStart, timezone)
  const weekEndString = getDateStringInTimezone(weekEnd, timezone)
  
  return sessions.filter(session => {
    const sessionDateString = getDateStringInTimezone(session.startTime, timezone)
    return sessionDateString >= weekStartString && sessionDateString <= weekEndString
  })
}

/**
 * タイムゾーン情報を表示用文字列に変換
 */
export function getTimezoneDisplayName(timezone: string): string {
  const timezoneInfo = TIMEZONES.find(tz => tz.value === timezone)
  return timezoneInfo ? timezoneInfo.label : timezone
}

/**
 * 日付跨ぎセッションを分割（タイムゾーン考慮）
 */
export function splitSessionByDateInTimezone(
  startTime: Date,
  endTime: Date,
  totalDuration: number,
  timezone: string
): Array<{
  startTime: Date
  endTime: Date
  duration: number
  date: string
}> {
  const sessions: Array<{
    startTime: Date
    endTime: Date
    duration: number
    date: string
  }> = []

  let currentStart = new Date(startTime)
  const sessionEndTime = new Date(endTime)
  
  while (currentStart < sessionEndTime) {
    // 現在の日付の終了時刻（翌日の00:00:00）をタイムゾーンで計算
    const currentStartInTimezone = new Date(currentStart.toLocaleString('en-US', { timeZone: timezone }))
    const nextDayStart = new Date(currentStartInTimezone)
    nextDayStart.setDate(nextDayStart.getDate() + 1)
    nextDayStart.setHours(0, 0, 0, 0)

    // この日のセッション終了時刻を決定
    const sessionEnd = sessionEndTime < nextDayStart ? sessionEndTime : nextDayStart

    // この日のセッション時間を計算（秒単位）
    const sessionDuration = Math.floor((sessionEnd.getTime() - currentStart.getTime()) / 1000)

    if (sessionDuration > 0) {
      sessions.push({
        startTime: new Date(currentStart),
        endTime: new Date(sessionEnd),
        duration: sessionDuration,
        date: getDateStringInTimezone(currentStart, timezone)
      })
    }

    // 次の日の開始時刻（00:00:00）
    currentStart = new Date(nextDayStart)
  }

  return sessions
} 