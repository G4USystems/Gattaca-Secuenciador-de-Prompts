'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useToast } from './ToastContext'
import { ToastItem } from './ToastItem'

// Single Responsibility: Only manages toast positioning and rendering
export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-label="Notificaciones"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={removeToast} />
        </div>
      ))}
    </div>,
    document.body
  )
}
