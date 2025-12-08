/**
 * クライアントサイド用のロガー
 * 開発環境のみログを出力し、本番環境では何も出力しない
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const clientLogger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args)
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },
}
