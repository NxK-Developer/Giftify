import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'violet' | 'pink' | 'green' | 'amber' | 'cyan' | 'red' | 'neutral'

const TONES: Record<BadgeTone, string> = {
  violet: 'bg-brand/14 text-brand-soft border-brand/25',
  pink: 'bg-accent/12 text-accent-soft border-accent/25',
  green: 'bg-success/12 text-success border-success/25',
  amber: 'bg-gold/12 text-gold border-gold/25',
  cyan: 'bg-neon/12 text-neon border-neon/25',
  red: 'bg-danger/12 text-danger border-danger/25',
  neutral: 'bg-white/6 text-muted border-white/12',
}

export default function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
