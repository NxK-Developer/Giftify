import { cn } from '@/utils/cn'
import { BRAND } from '@/constants/brand'

export interface NxKMonogramProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  glow?: boolean
  className?: string
}

const SIZES = {
  xs: 'size-7 rounded-lg text-[10px]',
  sm: 'size-9 rounded-xl text-xs',
  md: 'size-11 rounded-2xl text-sm',
  lg: 'size-16 rounded-3xl text-xl',
  xl: 'size-20 rounded-[26px] text-2xl',
} as const

/**
 * NxK monogram — the subtle developer identity. A gradient tile with the
 * NxK wordmark; used in navbars, loading screens, admin and footers.
 * Never oversized inside greeting experiences (the gift is the hero).
 */
export default function NxKMonogram({ size = 'md', glow = true, className }: NxKMonogramProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex select-none items-center justify-center bg-[linear-gradient(135deg,#8b5cf6_0%,#a855f7_40%,#ec4899_100%)] font-display font-extrabold tracking-tight text-white',
        glow && 'shadow-[0_0_24px_rgba(139,92,246,0.55)]',
        SIZES[size],
        className,
      )}
    >
      {BRAND.monogram}
    </span>
  )
}
