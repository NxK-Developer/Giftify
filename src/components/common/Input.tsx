import type { InputHTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const FIELD_BASE =
  'w-full rounded-2xl border bg-white/4 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-200 focus:border-brand-soft/70 focus:bg-white/6 focus:outline-none'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string | null
  hint?: ReactNode
  counter?: { current: number; max: number }
  icon?: ReactNode
}

export function Input({ label, error, hint, counter, icon, className, id, ...rest }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-dim">
          {label}
        </label>
        {counter && (
          <span
            className={cn(
              'font-mono text-[11px] tabular-nums',
              counter.current > counter.max ? 'text-danger' : 'text-muted',
            )}
            aria-live="polite"
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            FIELD_BASE,
            'min-h-12',
            Boolean(icon) && 'pl-11',
            error ? 'border-danger/60' : 'border-line',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string | null
  hint?: ReactNode
  counter?: { current: number; max: number }
  /** React 19: ref is a regular prop on function components */
  ref?: Ref<HTMLTextAreaElement>
}

export function Textarea({ label, error, hint, counter, className, id, ...rest }: TextareaProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-dim">
          {label}
        </label>
        {counter && (
          <span
            className={cn(
              'font-mono text-[11px] tabular-nums',
              counter.current > counter.max ? 'text-danger' : 'text-muted',
            )}
            aria-live="polite"
          >
            {counter.current}/{counter.max}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        className={cn(
          FIELD_BASE,
          'min-h-28 resize-y py-3.5 leading-relaxed',
          error ? 'border-danger/60' : 'border-line',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string | null
  hint?: ReactNode
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, hint, options, placeholder, className, id, ...rest }: SelectProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={inputId} className="text-[13px] font-semibold text-ink-dim">
            {label}
          </label>
        </div>
      )}
      <select
        id={inputId}
        className={cn(
          FIELD_BASE,
          'min-h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2716%27%20height%3D%2716%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23a89fc0%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")] bg-[position:right_1rem_center] bg-no-repeat pr-10',
          error ? 'border-danger/60' : 'border-line',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-ink">
            {o.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-danger" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}
