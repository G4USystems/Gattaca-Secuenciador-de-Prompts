'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Toast, ToastType } from './types'

// Single Responsibility: Only handles rendering a single toast
interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

// Style configurations - Open/Closed Principle: Add new types without modifying existing code
const TOAST_STYLES: Record<ToastType, {
  container: string
  icon: string
  iconComponent: typeof CheckCircle
  progressBar: string
}> = {
  success: {
    container: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950/50 dark:to-green-950/50 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconComponent: CheckCircle,
    progressBar: 'bg-emerald-500',
  },
  error: {
    container: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 dark:from-red-950/50 dark:to-rose-950/50 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    iconComponent: AlertCircle,
    progressBar: 'bg-red-500',
  },
  warning: {
    container: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/50 dark:to-yellow-950/50 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    iconComponent: AlertTriangle,
    progressBar: 'bg-amber-500',
  },
  info: {
    container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    iconComponent: Info,
    progressBar: 'bg-blue-500',
  },
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const styles = TOAST_STYLES[toast.type]
  const IconComponent = styles.iconComponent

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onDismiss(toast.id)
    }, 200)
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden
        w-full max-w-sm
        border rounded-xl shadow-lg
        transform transition-all duration-200 ease-out
        ${styles.container}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 break-words">
                {toast.message}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          {toast.dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 dark:hover:text-gray-200 dark:hover:bg-gray-800/50 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50 dark:bg-gray-700/50">
          <div
            className={`h-full ${styles.progressBar} transition-none`}
            style={{
              animation: `shrink ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}
