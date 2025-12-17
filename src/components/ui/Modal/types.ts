// Modal Types - Interface Segregation Principle
export type ModalVariant = 'danger' | 'warning' | 'info' | 'default'

export interface ConfirmModalConfig {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ModalVariant
  icon?: React.ReactNode
}

export interface ConfirmModalState extends ConfirmModalConfig {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Context interface - Dependency Inversion Principle
export interface ModalContextValue {
  // Confirm dialog returns a promise that resolves to boolean
  confirm: (config: ConfirmModalConfig) => Promise<boolean>
  // Close any open modal
  closeModal: () => void
}

export interface ModalProviderProps {
  children: React.ReactNode
}
