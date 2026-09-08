import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import type { ToastItem, ToastKind } from '@/types'
import { uid } from '@/utils/id'
import { cn } from '@/utils/cn'

interface ToastContextValue {
  pushToast: (kind: ToastKind, title: string, message?: string, durationMs?: number) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, number>())

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const pushToast = useCallback(
    (kind: ToastKind, title: string, message?: string, durationMs = 4200) => {
      const id = uid('toast-')
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message, durationMs }])
      const timer = window.setTimeout(() => dismissToast(id), durationMs)
      timers.current.set(id, timer)
      return id
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      {/* Toast viewport — top on mobile, bottom-right on desktop */}
      <div
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:top-auto sm:bottom-5 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.kind]
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={cn(
                'toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl',
                t.kind === 'success' && 'border-emerald-400/25 bg-emerald-950/80 text-emerald-100',
                t.kind === 'error' && 'border-rose-400/25 bg-rose-950/80 text-rose-100',
                t.kind === 'info' && 'border-violet-400/25 bg-violet-950/85 text-violet-100',
              )}
            >
              <Icon
                className={cn(
                  'mt-0.5 size-5 shrink-0',
                  t.kind === 'success' && 'text-emerald-400',
                  t.kind === 'error' && 'text-rose-400',
                  t.kind === 'info' && 'text-violet-300',
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs leading-relaxed opacity-80">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="rounded-lg p-1 opacity-60 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
