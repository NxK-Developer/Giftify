import { useEffect, useState } from 'react'
import NxKMonogram from './NxKMonogram'
import { cn } from '@/utils/cn'

export interface LoadingScreenProps {
  label?: string
  /** Rotating cinematic status lines (branded loading, not a generic spinner) */
  progressLines?: string[]
  /** Fixed fullscreen (page-level) vs contained (inline) */
  fullscreen?: boolean
  className?: string
}

const DEFAULT_LINES = [
  'Preparing something special…',
  'Polishing the pixels…',
  'Charging the glow…',
  'Almost there…',
]

export default function LoadingScreen({
  label,
  progressLines = DEFAULT_LINES,
  fullscreen = true,
  className,
}: LoadingScreenProps) {
  const [lineIdx, setLineIdx] = useState(0)

  useEffect(() => {
    if (progressLines.length <= 1) return
    const t = window.setInterval(() => {
      setLineIdx((i) => (i + 1) % progressLines.length)
    }, 2200)
    return () => window.clearInterval(t)
  }, [progressLines.length])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-6 px-6 text-center',
        fullscreen && 'fixed inset-0 z-[95] bg-base/92 backdrop-blur-xl',
        !fullscreen && 'min-h-48 py-12',
        className,
      )}
    >
      <div className="relative">
        <div className="absolute -inset-8 rounded-full bg-brand/15 blur-2xl animate-pulse-glow" aria-hidden="true" />
        <NxKMonogram size="lg" className="relative animate-heartbeat" />
      </div>
      <div className="space-y-2">
        <p className="font-display text-sm font-semibold tracking-wide text-ink-dim">
          {label ?? progressLines[lineIdx]}
        </p>
        {!label && (
          <div className="mx-auto flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-brand-soft animate-twinkle"
                style={{ animationDelay: `${i * 0.22}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
