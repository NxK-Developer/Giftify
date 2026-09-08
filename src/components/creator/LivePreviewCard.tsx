import { useMemo } from 'react'
import { getTheme } from '@/constants/themes'
import { getOccasion } from '@/constants/occasions'
import type { WizardState } from '@/types'
import { cn } from '@/utils/cn'

export interface LivePreviewCardProps {
  wizard: WizardState
  compact?: boolean
  className?: string
}

/**
 * LivePreviewCard — an honest, real-time mini render of the final greeting
 * card (theme colors, names, message) shown while personalizing. The full
 * cinematic sequence is previewed on /preview.
 */
export default function LivePreviewCard({ wizard, compact, className }: LivePreviewCardProps) {
  const theme = getTheme(wizard.theme)
  const occasion = getOccasion(wizard.occasion)
  const recipient = wizard.recipientName.trim() || 'Their Name'
  const message = wizard.message.trim() || 'Your heartfelt message will appear here, word by word…'

  const isScript = useMemo(
    () => theme.fontTone === 'script' && (wizard.occasion === 'love' || wizard.occasion === 'anniversary'),
    [theme.fontTone, wizard.occasion],
  )

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_70px_-24px_rgba(0,0,0,0.85)]',
        className,
      )}
      style={{
        background: `radial-gradient(130% 120% at 15% 0%, ${theme.background[2]}, ${theme.background[0]} 58%, ${theme.base})`,
      }}
      aria-label="Live preview of your greeting card"
    >
      {/* glow + dots */}
      <div
        aria-hidden="true"
        className="absolute -top-14 left-1/2 size-44 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: theme.glow, opacity: 0.5 }}
      />
      {theme.particleColors.slice(0, 4).map((c, i) => (
        <span
          key={c + i}
          aria-hidden="true"
          className="absolute size-1.5 rounded-full animate-twinkle"
          style={{
            background: c,
            boxShadow: `0 0 8px ${c}`,
            left: `${10 + i * 26}%`,
            top: `${14 + ((i * 23) % 40)}%`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      <div className={cn('relative flex flex-col items-center px-6 text-center', compact ? 'py-7' : 'py-10')}>
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase backdrop-blur">
          {occasion.emoji} {occasion.name}
        </span>
        <p
          className={cn(
            'mt-4 font-display font-extrabold tracking-tight text-white text-glow',
            compact ? 'text-xl' : 'text-2xl sm:text-3xl',
            isScript && 'font-script font-medium tracking-wide',
          )}
        >
          Hey, {recipient} {theme.id === 'heart' || wizard.occasion === 'love' ? '❤️' : '✨'}
        </p>
        <p
          className={cn(
            'mt-3 leading-relaxed text-white/82',
            compact ? 'line-clamp-3 text-[12.5px]' : 'line-clamp-5 text-sm',
            isScript && 'font-script text-base',
          )}
        >
          {message}
        </p>
        {wizard.senderName.trim() && (
          <p className="mt-4 text-[11px] font-semibold tracking-wide text-white/55 uppercase">
            — with love, {wizard.senderName.trim()}
          </p>
        )}
        <p className="mt-5 font-mono text-[9px] tracking-[0.3em] text-white/35 uppercase">
          Created with NxK Developer
        </p>
      </div>
    </div>
  )
}
