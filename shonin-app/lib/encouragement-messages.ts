/**
 * マイクロモーメントの褒め言葉・励ましメッセージ
 * 
 * メッセージはmessages/ja.json, en.jsonの"encouragement"セクションで管理されています
 */

/**
 * 配列からランダムに要素を選択する
 */
const getRandomElement = <T,>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length)
  return array[randomIndex]
}

/**
 * セッション開始時のメッセージを取得
 * @param sessionCount その日の何回目のセッションか
 * @param messages i18nのencouragementメッセージオブジェクト
 */
export const getSessionStartMessage = (
  sessionCount: number, 
  messages: any
): string => {
  const sessionStart = messages.session_start
  
  let messageArray: string[]
  if (sessionCount === 1) {
    messageArray = sessionStart.first
  } else if (sessionCount === 2) {
    messageArray = sessionStart.second
  } else if (sessionCount === 3) {
    messageArray = sessionStart.third
  } else if (sessionCount === 4) {
    messageArray = sessionStart.fourth
  } else {
    messageArray = sessionStart.fifth_plus
  }

  const message = getRandomElement(messageArray)
  // {count}プレースホルダーを置換
  return message.replace('{count}', sessionCount.toString())
}

/**
 * 15分経過時のメッセージを取得
 */
export const get15MinutesPassedMessage = (messages: any): string => {
  return getRandomElement(messages.fifteen_minutes)
}

/**
 * 目標時間達成時のメッセージを取得
 */
export const getGoalAchievedMessage = (messages: any): string => {
  return getRandomElement(messages.goal_achieved)
}

/**
 * 連続記録達成時のメッセージを取得
 * @param streakDays 連続日数
 */
export const getStreakMessage = (streakDays: number, messages: any): string => {
  const message = getRandomElement(messages.streak)
  // {days}プレースホルダーを置換
  return message.replace('{days}', streakDays.toString())
}

