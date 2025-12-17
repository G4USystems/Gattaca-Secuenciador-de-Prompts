'use client'

import { createContext, useContext, useCallback, useState, useMemo, ReactNode } from 'react'
import { ConfirmModalConfig, ConfirmModalState, ModalContextValue } from './types'
import { ConfirmModal } from './ConfirmModal'

const ModalContext = createContext<ModalContextValue | null>(null)

interface ModalProviderProps {
  children: ReactNode
}

// Default state - Closed modal
const defaultModalState: ConfirmModalState = {
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {},
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modalState, setModalState] = useState<ConfirmModalState>(defaultModalState)

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const confirm = useCallback((config: ConfirmModalConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: config.title,
        message: config.message,
        confirmText: config.confirmText ?? 'Confirmar',
        cancelText: config.cancelText ?? 'Cancelar',
        variant: config.variant ?? 'default',
        icon: config.icon,
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }))
          resolve(true)
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }))
          resolve(false)
        },
      })
    })
  }, [])

  const value = useMemo(
    () => ({
      confirm,
      closeModal,
    }),
    [confirm, closeModal]
  )

  return (
    <ModalContext.Provider value={value}>
      {children}
      <ConfirmModal {...modalState} />
    </ModalContext.Provider>
  )
}

// Custom hook with proper error handling
export function useModal(): ModalContextValue {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
