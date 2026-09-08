import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'
import { EMOJI_CATEGORIES, QUICK_EMOJIS } from '@/constants/emojis'
import { cn } from '@/utils/cn'

export interface EmojiPickerProps {
  onPick: (emoji: string) => void
  disabled?: boolean
}

/** Compact, dependency-free emoji picker with categories + quick row. */
export default function EmojiPicker({ onPick, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0]?.id ?? 'hearts')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = EMOJI_CATEGORIES.find((c) => c.id === category) ?? EMOJI_CATEGORIES[0]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Open emoji picker"
        className={cn(
          'flex min-h-11 items-center gap-1.5 rounded-2xl border border-line bg-white/4 px-3.5 text-sm font-medium text-ink-dim transition hover:border-brand-soft/50 hover:text-ink disabled:opacity-40',
          open && 'border-brand-soft/70 text-ink',
        )}
      >
        <Smile className="size-4 text-gold" aria-hidden="true" />
        Emoji
      </button>

      {open && (
        <div className="glass-strong absolute bottom-full left-0 z-40 mb-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl p-3 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.8)] animate-scale-in">
          {/* Quick row */}
          <div className="mb-2 flex flex-wrap gap-1">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onPick(e)
                  setOpen(false)
                }}
                className="size-9 rounded-xl text-xl transition hover:scale-115 hover:bg-white/10"
                aria-label={`Insert ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
          {/* Categories */}
          <div className="mb-2 flex gap-1 border-y border-line py-1.5">
            {EMOJI_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-label={c.label}
                aria-pressed={category === c.id}
                className={cn(
                  'flex-1 rounded-lg py-1 text-center text-base transition',
                  category === c.id ? 'bg-brand/20 shadow-[0_0_12px_rgba(139,92,246,0.35)]' : 'hover:bg-white/6',
                )}
              >
                {c.icon}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div className="grid max-h-40 grid-cols-8 gap-0.5 overflow-y-auto" role="listbox" aria-label={`${active?.label} emoji`}>
            {active?.emojis.map((e) => (
              <button
                key={e}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onPick(e)
                  setOpen(false)
                }}
                className="size-8 rounded-lg text-lg transition hover:scale-115 hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
