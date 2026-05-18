import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastProps {
  message: string
  type: ToastType
}

export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null)

  const showToast = useCallback(({ message, type }: ToastProps) => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  return { toast, showToast, hideToast }
}
