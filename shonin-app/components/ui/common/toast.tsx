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
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getToastStyles = () => {
    const baseStyles = "flex items-center p-4 mb-3 text-sm rounded-lg shadow-lg transform transition-all duration-300 ease-in-out max-w-md"
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`
    }

    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 text-green-800 border border-green-200`
      case 'error':
        return `${baseStyles} bg-red-50 text-red-800 border border-red-200`
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-800 border border-yellow-200`
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 text-blue-800 border border-blue-200`
    }
  }

  const getIcon = () => {
    const iconProps = { className: "w-5 h-5 mr-3 flex-shrink-0" }
    
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
          setIsVisible(false)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
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
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
} 