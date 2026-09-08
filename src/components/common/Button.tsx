import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'gold'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  /** Render as a router Link instead of <button> */
  to?: string
  fullWidth?: boolean
}

const BASE =
  'press relative inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-soft'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-[linear-gradient(120deg,#8b5cf6,#a855f7_45%,#ec4899)] shadow-[0_8px_30px_-8px_rgba(139,92,246,0.65)] hover:shadow-[0_10px_38px_-6px_rgba(236,72,153,0.6)] hover:brightness-110',
  secondary:
    'text-ink glass hover:bg-white/10 hover:border-white/20 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.6)]',
  ghost: 'text-ink-dim hover:text-ink hover:bg-white/6',
  outline:
    'text-ink border border-line-strong hover:border-brand-soft/60 hover:bg-brand/8 shadow-[inset_0_0_18px_rgba(139,92,246,0.06)]',
  danger:
    'text-white bg-[linear-gradient(120deg,#e11d48,#fb7185)] shadow-[0_8px_26px_-10px_rgba(225,29,72,0.6)] hover:brightness-110',
  gold: 'text-[#2b1a03] bg-[linear-gradient(120deg,#fde68a,#fbbf24)] shadow-[0_8px_30px_-8px_rgba(251,191,36,0.55)] hover:brightness-105',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-[13px]',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-7 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  to,
  fullWidth,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)
  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </>
  )
  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}
