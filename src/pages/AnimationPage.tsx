import { useNavigate } from 'react-router-dom'
import { MonitorPlay } from 'lucide-react'
import WizardShell from '@/components/creator/WizardShell'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import { ANIMATION_STYLES } from '@/constants/animations'
import { useCreator } from '@/store/CreatorContext'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/utils/cn'

const PHASE_LABELS = {
  intro: { terminal: 'Terminal intro', soft: 'Soft fade-in', matrix: 'Full matrix rain', instant: 'Instant burst' },
  gather: { heart: 'Particles → heart', ring: 'Particles → ring', scatter: 'Free scatter' },
  flourish: {
    hearts: 'Rising hearts',
    petals: 'Petal shower',
    confetti: 'Confetti cannons',
    glyphs: 'Glyph cascade',
    sparkles: 'Sparkle burst',
  },
} as const

export default function AnimationPage() {
  useSeo({
    title: 'Choose an Animation Style — NxK Greetings',
    description: 'Cinematic code intro, heart formation, petal bloom, digital rain, confetti burst or classic reveal.',
    canonicalPath: '/animation',
  })
  const { wizard, patch } = useCreator()
  const navigate = useNavigate()

  return (
    <WizardShell
      step="animation"
      title="How should it unfold? 🎬"
      subtitle="The animation style shapes the recipient’s whole sequence — from the first frame to the final flourish."
      onNext={() => navigate('/music')}
      nextDisabled={!wizard.animation}
      nextLabel="Pick music"
      footerNote="Tip: you can preview the full sequence on the next-next step"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {ANIMATION_STYLES.map((a) => {
          const selected = wizard.animation === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => patch({ animation: a.id })}
              aria-pressed={selected}
              className={cn(
                'glass-card group relative flex flex-col overflow-hidden p-5 text-left transition-all duration-300 press',
                selected
                  ? '-translate-y-0.5 neon-border shadow-[0_0_48px_-10px_rgba(167,139,250,0.6)]'
                  : 'hover:-translate-y-0.5 hover:border-white/20',
              )}
            >
              <span
                aria-hidden="true"
                className="absolute -right-8 -top-8 size-28 rounded-full bg-brand/16 blur-2xl transition-all duration-500 group-hover:bg-accent/16"
              />
              <span className="relative flex items-center justify-between">
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl border text-2xl transition-transform duration-300 group-hover:scale-110',
                    selected ? 'border-brand-soft/60 bg-brand/15' : 'border-line bg-white/4',
                  )}
                >
                  {a.emoji}
                </span>
                {selected && (
                  <span className="flex size-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] text-[11px] font-bold text-white">
                    ✓
                  </span>
                )}
              </span>
              <span className="relative mt-3.5 block font-display text-[15px] font-bold text-ink">{a.name}</span>
              <span className="relative mt-1 block text-[12.5px] leading-relaxed text-muted">{a.description}</span>
              <span className="relative mt-3.5 flex flex-wrap gap-1.5">
                <span className="rounded-md border border-line bg-white/4 px-2 py-0.5 text-[10px] font-semibold text-ink-dim">
                  {PHASE_LABELS.intro[a.intro]}
                </span>
                <span className="rounded-md border border-line bg-white/4 px-2 py-0.5 text-[10px] font-semibold text-ink-dim">
                  {PHASE_LABELS.gather[a.gather]}
                </span>
                <span className="rounded-md border border-line bg-white/4 px-2 py-0.5 text-[10px] font-semibold text-ink-dim">
                  {PHASE_LABELS.flourish[a.flourish]}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <GlassCard className="mt-6 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
        <MonitorPlay className="size-5 shrink-0 text-neon" aria-hidden="true" />
        <p className="flex-1 text-[13px] leading-relaxed text-muted">
          Every style includes the full sequence — opening tap, particle build, heart/ring formation, name
          reveal, typewriter message and a final cinematic scene. You’ll see it end-to-end in Preview.
        </p>
        <Button variant="ghost" size="sm" to="/demo" className="shrink-0">
          See it live →
        </Button>
      </GlassCard>
    </WizardShell>
  )
}
