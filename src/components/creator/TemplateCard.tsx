import type { TemplateConfig } from '@/types'
import { getTheme } from '@/constants/themes'
import { getAnimationStyle } from '@/constants/animations'
import { getMusic } from '@/constants/music'
import { getOccasion } from '@/constants/occasions'
import { cn } from '@/utils/cn'

export interface TemplateCardProps {
  template: TemplateConfig
  selected: boolean
  onSelect: () => void
}

/**
 * TemplateCard — visual summary of a TemplateConfig. The mini "poster" is a
 * pure-CSS render of the template's theme gradient + particle dots, so the
 * card previews the actual configuration (no fake screenshots).
 */
export default function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const theme = getTheme(template.theme)
  const anim = getAnimationStyle(template.animation)
  const music = getMusic(template.music)
  const occasion = getOccasion(template.occasion)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-3xl border text-left transition-all duration-300 press',
        selected
          ? 'border-transparent -translate-y-0.5 neon-border shadow-[0_0_44px_-10px_rgba(167,139,250,0.6)]'
          : 'border-line bg-white/3 hover:-translate-y-0.5 hover:border-white/20',
      )}
    >
      {/* Poster */}
      <span
        aria-hidden="true"
        className="relative block h-32 overflow-hidden sm:h-36"
        style={{
          background: `radial-gradient(120% 130% at 20% 0%, ${theme.background[2]}, ${theme.background[0]} 60%, ${theme.base})`,
        }}
      >
        {/* particle dots preview */}
        {theme.particleColors.slice(0, 5).map((c, i) => (
          <span
            key={c}
            className="absolute rounded-full animate-twinkle"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: c,
              left: `${12 + i * 19}%`,
              top: `${18 + ((i * 31) % 55)}%`,
              animationDelay: `${i * 0.4}s`,
              boxShadow: `0 0 10px ${c}`,
            }}
          />
        ))}
        <span className="absolute inset-x-0 bottom-2.5 text-center text-3xl drop-shadow-[0_0_14px_rgba(255,255,255,0.35)] transition-transform duration-300 group-hover:scale-115">
          {template.accentEmoji}
        </span>
        {template.featured && (
          <span className="absolute left-2.5 top-2.5 rounded-full border border-gold/40 bg-black/40 px-2 py-0.5 text-[9px] font-bold tracking-widest text-gold uppercase backdrop-blur">
            ★ Popular
          </span>
        )}
        {selected && (
          <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] text-[11px] font-bold text-white shadow">
            ✓
          </span>
        )}
      </span>

      {/* Meta */}
      <span className="relative flex flex-1 flex-col p-4">
        <span className="font-display text-[15px] font-bold text-ink">{template.name}</span>
        <span className="mt-1 block text-[12px] leading-relaxed text-muted">{template.description}</span>
        <span className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-ink-dim">
          <span className="rounded-md border border-line bg-white/4 px-1.5 py-0.5">
            {occasion.emoji} {occasion.name}
          </span>
          <span className="rounded-md border border-line bg-white/4 px-1.5 py-0.5" style={{ color: theme.accent }}>
            {theme.emoji} {theme.name}
          </span>
          <span className="rounded-md border border-line bg-white/4 px-1.5 py-0.5">{anim.emoji} {anim.name}</span>
          <span className="rounded-md border border-line bg-white/4 px-1.5 py-0.5">{music.emoji} {music.name}</span>
        </span>
      </span>
    </button>
  )
}
