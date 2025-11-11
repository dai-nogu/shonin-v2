'use client'

import React, { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastComponentProps {
  toast: Toast
  onRemove: (id: string) => void
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // マウント時に少し遅らせて表示アニメーションを発動
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 50)

    // 指定時間後に非表示アニメーションを開始
    const hideTimer = setTimeout(() => {
      setIsExiting(true)
      setIsVisible(false)
      setTimeout(() => onRemove(toast.id), 1000)
    }, toast.duration || 5000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [toast.id, toast.duration, onRemove])

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-5 mb-3 text-base rounded-lg shadow-lg transform transition-all duration-1000 ease-in-out max-w-lg min-w-[320px]"
    
    // 非表示状態（上に消える）
    if (!isVisible) {
      return `${baseStyles} -translate-y-full opacity-0`
    }

    // 表示状態
    const visibleStyles = `${baseStyles} translate-y-0 opacity-100`

    switch (toast.type) {
      case 'success':
        return `${visibleStyles} bg-green-50 text-green-800 border border-green-200`
      case 'error':
        return `${visibleStyles} bg-red-50 text-red-800 border border-red-200`
      case 'warning':
        return `${visibleStyles} bg-yellow-50 text-yellow-800 border border-yellow-200`
      case 'info':
      default:
        return `${visibleStyles} bg-blue-50 text-blue-800 border border-blue-200`
    }
  }

  const getIcon = () => {
    const iconProps = { className: "w-6 h-6 mr-3 flex-shrink-0" }
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />
      case 'error':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />
      case 'warning':
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />
      case 'info':
      default:
        return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />
    }
  }

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => {
          setIsExiting(true)
          setIsVisible(false)
          setTimeout(() => onRemove(toast.id), 1000)
        }}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
} 