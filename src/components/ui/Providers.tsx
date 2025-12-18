'use client'

import { ReactNode } from 'react'
import { ToastProvider, ToastContainer } from './Toast'
import { ModalProvider } from './Modal'

interface UIProvidersProps {
  children: ReactNode
}

/**
 * UIProviders - Composite provider for all UI feedback systems
 * Following Composite Pattern to simplify provider setup
 */
export function UIProviders({ children }: UIProvidersProps) {
  return (
    <ToastProvider>
      <ModalProvider>
        {children}
        <ToastContainer />
      </ModalProvider>
    </ToastProvider>
  )
}
