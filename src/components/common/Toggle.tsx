import { cn } from '@/utils/cn'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-start justify-between gap-4', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors duration-300',
          checked
            ? 'border-brand-soft/60 bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] shadow-[0_0_18px_rgba(139,92,246,0.5)]'
            : 'border-line-strong bg-white/8',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all duration-300',
            checked ? 'left-[calc(100%-1.375rem)]' : 'left-1',
          )}
        />
      </button>
    </label>
  )
}
