import { cn } from '@/utils/cn'

export interface ProgressBarProps {
  /** 0..100 */
  value: number
  label?: string
  className?: string
  thin?: boolean
}

export default function ProgressBar({ value, label, className, thin }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? 'Progress'}
      className={cn('w-full overflow-hidden rounded-full bg-white/8', thin ? 'h-1' : 'h-2', className)}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#8b5cf6,#ec4899,#fbbf24)] shadow-[0_0_16px_rgba(236,72,153,0.55)] transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
