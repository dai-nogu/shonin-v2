/**
 * 日付関連のユーティリティ関数
 * ブラウザのローカルタイムゾーンを使用
 */

/**
 * 現在時刻を取得
 */
export function getCurrentTime(): Date {
  return new Date()
}

/**
 * 日付文字列を取得 (YYYY-MM-DD形式)
 */
export function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 時刻文字列を取得
 */
export function getTimeString(date: Date, format: '12h' | '24h' = '24h'): string {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: format === '12h'
  })
}

/**
 * 日付時刻文字列を取得
 */
export function getDateTimeString(date: Date): string {
  return date.toLocaleString('ja-JP')
}

/**
 * 週の開始日（月曜日）を取得
 */
export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // 月曜日を週の開始とする
  const weekStart = new Date(date)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

/**
 * 月の開始日を取得
 */
export function getMonthStart(date: Date = new Date()): Date {
  const monthStart = new Date(date)
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  return monthStart
}

/**
 * 日付の開始時刻（00:00:00）を取得
 */
export function getDayStart(date: Date): Date {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  return dayStart
}

/**
 * 日付の終了時刻（23:59:59）を取得
 */
export function getDayEnd(date: Date): Date {
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  return dayEnd
}

/**
 * 連続日数を計算
 */
export function calculateStreakDays(sessions: Array<{ startTime: Date }>): number {
  if (sessions.length === 0) return 0

  // セッションを日付ごとにグループ化
  const sessionsByDate = new Map<string, boolean>()
  sessions.forEach(session => {
    const dateKey = getDateString(session.startTime)
    sessionsByDate.set(dateKey, true)
  })

  // 今日から遡って連続日数を計算
  const today = new Date()
  const todayKey = getDateString(today)
  
  // 今日にセッションがあるかチェック
  const hasTodaySession = sessionsByDate.has(todayKey)
  
  let streakCount = 0
  for (let i = 0; i < 365; i++) { // 最大365日まで遡る
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateKey = getDateString(checkDate)
    
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
 * 今日のセッションをフィルタリング
 */
export function getTodaySessions<T extends { startTime: Date }>(sessions: T[]): T[] {
  const todayString = getDateString(new Date())
  
  return sessions.filter(session => {
    const sessionDateString = getDateString(session.startTime)
    return sessionDateString === todayString
  })
}

/**
 * 今週のセッションをフィルタリング
 */
export function getWeekSessions<T extends { startTime: Date }>(sessions: T[]): T[] {
  const today = new Date()
  const weekStart = getWeekStart(today)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  const weekStartString = getDateString(weekStart)
  const weekEndString = getDateString(weekEnd)
  
  return sessions.filter(session => {
    const sessionDateString = getDateString(session.startTime)
    return sessionDateString >= weekStartString && sessionDateString <= weekEndString
  })
}

/**
 * 日付跨ぎセッションを分割
 */
export function splitSessionByDate(
  startTime: Date,
  endTime: Date,
  totalDuration: number
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

  const startDateString = getDateString(startTime)
  const endDateString = getDateString(endTime)
  
  // 同じ日の場合は分割不要
  if (startDateString === endDateString) {
    sessions.push({
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: totalDuration,
      date: startDateString
    })
    return sessions
  }

  // 日付跨ぎの場合は分割
  let currentStart = new Date(startTime)
  const sessionEndTime = new Date(endTime)
  
  while (currentStart < sessionEndTime) {
    const currentDateString = getDateString(currentStart)
    
    // 現在の日付の終了時刻（23:59:59.999）を計算
    const currentDateEnd = new Date(currentStart)
    currentDateEnd.setHours(23, 59, 59, 999)
    
    // この日のセッション終了時刻を決定
    const sessionEnd = sessionEndTime < currentDateEnd ? sessionEndTime : currentDateEnd

    // この日のセッション時間を計算（秒単位）
    const sessionDuration = Math.floor((sessionEnd.getTime() - currentStart.getTime()) / 1000)

    if (sessionDuration > 0) {
      sessions.push({
        startTime: new Date(currentStart),
        endTime: new Date(sessionEnd),
        duration: sessionDuration,
        date: currentDateString
      })
    }

    // 次の日の開始時刻（翌日の00:00:00）
    const nextDay = new Date(currentDateEnd)
    nextDay.setTime(nextDay.getTime() + 1) // 23:59:59.999の1ms後 = 翌日00:00:00
    currentStart = nextDay
  }

  return sessions
}
