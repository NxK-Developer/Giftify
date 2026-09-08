import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Selected state — neon gradient border + stronger glow */
  selected?: boolean
  /** Enable hover lift + glow (interactive cards) */
  interactive?: boolean
  /** Denser background for content-heavy surfaces */
  strong?: boolean
}

export default function GlassCard({
  selected,
  interactive,
  strong,
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-3xl',
        strong && 'bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(13,8,32,0.55)_100%)]',
        selected && 'neon-border shadow-[0_0_44px_-8px_rgba(167,139,250,0.5)]',
        interactive &&
          'cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_22px_60px_-18px_rgba(139,92,246,0.45)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
