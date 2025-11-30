// カレンダーのデータ処理変更
import { getWeekStartInTimezone, getCurrentTimeInTimezone } from "@/lib/timezone-utils"
import type { CompletedSession } from "@/components/ui/dashboard/time-tracker"

export interface CalendarSession {
  id: string
  date: string
  activity: string
  duration: number
  color: string
  icon: string
}

// セッション変換関数（月・週共通）
export const convertToCalendarSessions = (
  sessions: CompletedSession[], 
  timezone: string = 'Asia/Tokyo'
): CalendarSession[] => {
  return sessions.map((session) => {
    // セッションデータの安全性チェック
    if (!session || !session.endTime) {
      return {
        id: session?.id || Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        activity: "不明なアクティビティ",
        duration: 0,
        color: "bg-gray-500",
        icon: "📝"
      }
    }

    // セッションに保存された色・アイコン情報を優先し、なければ名前から推測
    const getActivityStyle = (session: CompletedSession) => {
      // セッションに色・アイコンが保存されている場合はそれを使用
      if (session.activityColor && session.activityIcon) {
        return { icon: session.activityIcon, color: session.activityColor }
      }

      // 色だけが保存されている場合
      if (session.activityColor) {
        return { icon: session.activityIcon || "", color: session.activityColor }
      }

      // 保存されていない場合は名前から推測（従来の方法）
      const activity = session.activityName
      if (!activity) {
        return { icon: "📝", color: "bg-gray-500" }
      }
      
      const activityLower = activity.toLowerCase()
      if (activityLower.includes('読書') || activityLower.includes('本')) {
        return { icon: "📚", color: "bg-blue-500" }
      } else if (activityLower.includes('プログラミング') || activityLower.includes('コード') || activityLower.includes('開発')) {
        return { icon: "💻", color: "bg-purple-500" }
      } else if (activityLower.includes('運動') || activityLower.includes('筋トレ') || activityLower.includes('ジム')) {
        return { icon: "🏃", color: "bg-red-500" }
      } else if (activityLower.includes('音楽') || activityLower.includes('楽器')) {
        return { icon: "🎵", color: "bg-yellow-500" }
      } else if (activityLower.includes('勉強') || activityLower.includes('学習')) {
        return { icon: "📖", color: "bg-green-500" }
      } else if (activityLower.includes('英語') || activityLower.includes('語学')) {
        return { icon: "🌍", color: "bg-teal-500" }
      } else if (activityLower.includes('絵') || activityLower.includes('デザイン') || activityLower.includes('アート')) {
        return { icon: "🎨", color: "bg-pink-500" }
      } else {
        return { icon: "📝", color: "bg-gray-500" }
      }
    }

    const style = getActivityStyle(session)
    
    // セッション日付の決定：session_dateがあればそれを使用、なければstartTimeから計算
    let dateStr: string
    if (session.sessionDate) {
      // データベースに保存されたsession_dateを使用（最も確実）
      dateStr = session.sessionDate
    } else {
      // フォールバック：startTimeから計算（従来の方法）
      const sessionDate = new Date(session.startTime)
      dateStr = sessionDate.toLocaleDateString('sv-SE', { timeZone: timezone })
    }

    return {
      id: session.id || Date.now().toString(),
      date: dateStr,
      activity: session.activityName || "不明なアクティビティ",
      duration: session.duration || 0, // 秒単位のまま保持
      color: style.color,
      icon: style.icon
    }
  })
}

// 指定日のセッション取得（月用）
export const getSessionsForDate = (
  date: number | null, 
  currentDate: Date, 
  sessions: CalendarSession[]
): CalendarSession[] => {
  if (!date) return []

  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
  const dateSessions = sessions.filter((session) => session.date === dateStr)
  
  // 同じアクティビティをまとめる
  const groupedSessions = new Map<string, CalendarSession>()
  dateSessions.forEach(session => {
    const key = session.activity
    if (groupedSessions.has(key)) {
      const existing = groupedSessions.get(key)!
      existing.duration += session.duration
    } else {
      groupedSessions.set(key, { ...session })
    }
  })
  
  return Array.from(groupedSessions.values())
}

// 指定日のセッション取得（週用）
export const getSessionsForWeekDate = (
  date: Date, 
  sessions: CalendarSession[]
): CalendarSession[] => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  const dateSessions = sessions.filter((session) => session.date === dateStr)
  
  // 同じアクティビティをまとめる
  const groupedSessions = new Map<string, CalendarSession>()
  dateSessions.forEach(session => {
    const key = session.activity
    if (groupedSessions.has(key)) {
      const existing = groupedSessions.get(key)!
      existing.duration += session.duration
    } else {
      groupedSessions.set(key, { ...session })
    }
  })
  
  return Array.from(groupedSessions.values())
}

// 月の日数を取得
export const getDaysInMonth = (date: Date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    date = new Date() // デフォルトで今日の日付を使用
  }
  
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  // 月曜日を週の開始にするため、日曜日を6、月曜日を0にする
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7

  const days = []

  // 前月の日付を埋める
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null)
  }

  // 今月の日付
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return days
}

// 今日かどうかチェック（月用）
export const isToday = (date: number | null, currentDate: Date) => {
  const today = new Date()
  if (typeof date === "number") {
    return (
      date === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }
  return false
}

// 今日かどうかチェック（週用）
export const isTodayWeek = (date: Date) => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// 月間セッション集計
export const getCurrentMonthSessions = (currentDate: Date, sessions: CalendarSession[]) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const periodSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate.getFullYear() === year && sessionDate.getMonth() === month
  })
  
  // 同じアクティビティをまとめる（統計用）
  const groupedSessions = new Map<string, CalendarSession>()
  periodSessions.forEach(session => {
    const key = `${session.activity}-${session.date}`
    if (groupedSessions.has(key)) {
      const existing = groupedSessions.get(key)!
      existing.duration += session.duration
    } else {
      groupedSessions.set(key, { ...session })
    }
  })
  
  return Array.from(groupedSessions.values())
}

// 週間セッション集計
export const getCurrentWeekSessions = (currentDate: Date, sessions: CalendarSession[], timezone: string) => {
  // タイムゾーンを考慮した週の範囲を計算
  const weekStart = getWeekStartInTimezone(currentDate, timezone)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const periodSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })
  
  // 同じアクティビティをまとめる（統計用）
  const groupedSessions = new Map<string, CalendarSession>()
  periodSessions.forEach(session => {
    const key = `${session.activity}-${session.date}`
    if (groupedSessions.has(key)) {
      const existing = groupedSessions.get(key)!
      existing.duration += session.duration
    } else {
      groupedSessions.set(key, { ...session })
    }
  })
  
  return Array.from(groupedSessions.values())
}

// 週の平均時間計算
export const calculateWeekAverageTime = (
  currentDate: Date, 
  sessions: CalendarSession[], 
  timezone: string
): number => {
  const currentWeekSessions = getCurrentWeekSessions(currentDate, sessions, timezone)
  if (currentWeekSessions.length === 0) return 0
  
  const totalTime = currentWeekSessions.reduce((total, session) => total + session.duration, 0)

  // タイムゾーンを考慮した正確な今日の日付と週の開始日を取得
  const today = getCurrentTimeInTimezone(timezone)
  const currentWeekStart = getWeekStartInTimezone(currentDate, timezone)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
  
  // 今日が表示中の週の範囲内かチェック
  const isCurrentWeek = today >= currentWeekStart && today <= currentWeekEnd
  
  let daysPassed: number
  if (isCurrentWeek) {
    // 今週の場合：月曜日から今日までの日数
    const diffTime = today.getTime() - currentWeekStart.getTime()
    daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1は今日を含むため
  } else {
    // 過去または未来の週の場合：その週の7日間で割る
    daysPassed = 7
  }
  
  return Math.floor(totalTime / daysPassed)
} 