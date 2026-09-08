import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon: ReactNode
  title: string
  message: string
  action?: ReactNode
  className?: string
}

export default function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-3xl border border-line bg-white/2 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-3xl bg-brand/10 text-3xl" aria-hidden="true">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted">{message}</p>
      </div>
      {action}
    </div>
  )
}
