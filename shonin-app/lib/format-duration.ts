/**
 * 秒数を時間表示にフォーマットする共通関数
 * @param totalSeconds - 秒数
 * @returns フォーマットされた時間文字列
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds === 0) {
    return "0"
  }
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
}

/**
 * 時間と分を個別に受け取ってフォーマットする関数（WelcomeCard用）
 * @param hours - 時間
 * @param minutes - 分
 * @returns フォーマットされた時間文字列
 */
export function formatTime(hours: number, minutes: number): string {
  if (hours === 0 && minutes === 0) {
    return ""
  }
  if (hours > 0 && minutes > 0) {
    return `${hours}h${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
} 