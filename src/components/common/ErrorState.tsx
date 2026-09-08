import type { ReactNode } from 'react'
import { TriangleAlert, RotateCw, Home } from 'lucide-react'
import Button from './Button'
import { cn } from '@/utils/cn'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  secondaryAction?: ReactNode
  icon?: ReactNode
  className?: string
  compact?: boolean
}

/** Polished error surface — every async failure lands here, never a blank screen. */
export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  secondaryAction,
  icon,
  className,
  compact,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-4 rounded-3xl border border-danger/20 bg-danger/5 px-6 text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger/12 text-danger">
        {icon ?? <TriangleAlert className="size-7" aria-hidden="true" />}
      </div>
      <div className="space-y-1.5">
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button variant="secondary" size="sm" icon={<RotateCw className="size-4" />} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondaryAction}
        {!onRetry && !secondaryAction && (
          <Button variant="ghost" size="sm" to="/" icon={<Home className="size-4" />}>
            Back home
          </Button>
        )}
      </div>
    </div>
  )
}
