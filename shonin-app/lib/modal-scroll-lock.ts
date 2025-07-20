// モーダルのスクロールロック管理
let lockCount = 0
let originalBodyStyles: {
  overflow: string
  position: string
  width: string
  height: string
} | null = null

export function lockBodyScroll() {
  if (lockCount === 0) {
    // 最初のモーダルが開く時のみ、元のスタイルを保存してスクロールを無効化
    originalBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      width: document.body.style.width,
      height: document.body.style.height
    }
    
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
  }
  lockCount++
}

export function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1)
  
  if (lockCount === 0 && originalBodyStyles) {
    // 最後のモーダルが閉じる時のみ、元のスタイルを復元
    document.body.style.overflow = originalBodyStyles.overflow
    document.body.style.position = originalBodyStyles.position
    document.body.style.width = originalBodyStyles.width
    document.body.style.height = originalBodyStyles.height
    originalBodyStyles = null
  }
}

// React hook
import { useEffect } from 'react'

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      lockBodyScroll()
      return () => {
        unlockBodyScroll()
      }
    }
  }, [isLocked])
} 