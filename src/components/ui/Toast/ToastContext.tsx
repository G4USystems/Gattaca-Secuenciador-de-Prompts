'use client'

import { createContext, useContext, useCallback, useState, useMemo, ReactNode } from 'react'
import { Toast, ToastConfig, ToastContextValue, ToastType } from './types'

const ToastContext = createContext<ToastContextValue | null>(null)

// Default durations per type - Open/Closed Principle: easily extensible
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  error: 6000,
  warning: 5000,
  info: 4000,
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (type: ToastType, config: ToastConfig): string => {
      const id = generateId()
      const duration = config.duration ?? DEFAULT_DURATIONS[type]
      const dismissible = config.dismissible ?? true

      const newToast: Toast = {
        id,
        type,
        title: config.title,
        message: config.message,
        duration,
        dismissible,
      }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    [generateId, removeToast]
  )

  // Convenience methods - Single Responsibility for each type
  const success = useCallback(
    (title: string, message?: string) => addToast('success', { title, message }),
    [addToast]
  )

  const error = useCallback(
    (title: string, message?: string) => addToast('error', { title, message }),
    [addToast]
  )

  const warning = useCallback(
    (title: string, message?: string) => addToast('warning', { title, message }),
    [addToast]
  )

  const info = useCallback(
    (title: string, message?: string) => addToast('info', { title, message }),
    [addToast]
  )

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, removeToast, success, error, warning, info]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// Custom hook with proper error handling
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
