// Toast 通知组件
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info as InfoIcon } from '@phosphor-icons/react'

export interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  leaving?: boolean
}

let toastId = 0
let addToast: ((opts: ToastOptions) => void) | null = null

export function showToast(opts: ToastOptions) {
  addToast?.(opts)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToast = (opts) => {
      const id = ++toastId
      const duration = opts.duration ?? 3000
      setToasts(prev => [...prev, { ...opts, id }])
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250)
      }, duration)
    }
    return () => { addToast = null }
  }, [])

  if (toasts.length === 0) return null

  const iconMap = {
    success: <CheckCircle size={16} weight="fill" className="text-green-400" />,
    error: <XCircle size={16} weight="fill" className="text-red-400" />,
    info: <InfoIcon size={16} weight="fill" className="text-[var(--accent)]" />,
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] shadow-xl bg-[var(--bg-root)]/92 backdrop-blur-xl border border-[var(--border-hairline)] ${
            t.leaving ? 'animate-fade-out' : 'animate-slide-up'
          }`}
        >
          {iconMap[t.type ?? 'info']}
          {t.message}
        </div>
      ))}
    </div>
  )
}
