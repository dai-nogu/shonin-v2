import React from 'react'

// モーダルのスクロールロック管理ユーティリティ
class ModalScrollLockManager {
  private lockCount = 0

  lock() {
    this.lockCount++
    if (this.lockCount === 1) {
      document.body.style.overflow = 'hidden'
    }
  }

  unlock() {
    this.lockCount = Math.max(0, this.lockCount - 1)
    if (this.lockCount === 0) {
      document.body.style.overflow = 'unset'
    }
  }

  // 強制的にリセット（コンポーネントのアンマウント時など）
  reset() {
    this.lockCount = 0
    document.body.style.overflow = 'unset'
  }
}

export const modalScrollLock = new ModalScrollLockManager()

// Reactフック版
export function useModalScrollLock(isOpen: boolean) {
  React.useEffect(() => {
    if (isOpen) {
      modalScrollLock.lock()
    } else {
      modalScrollLock.unlock()
    }

    return () => {
      modalScrollLock.unlock()
    }
  }, [isOpen])
} 