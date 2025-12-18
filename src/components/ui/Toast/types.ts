// Toast Types - Following Interface Segregation Principle
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

export interface ToastConfig {
  title: string
  message?: string
  duration?: number
  dismissible?: boolean
}

// Context interface - Dependency Inversion Principle
export interface ToastContextValue {
  toasts: Toast[]
  addToast: (type: ToastType, config: ToastConfig) => string
  removeToast: (id: string) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}
