import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import WizardShell from '@/components/creator/WizardShell'
import { OCCASIONS } from '@/constants/occasions'
import type { OccasionId } from '@/types'
import { useCreator } from '@/store/CreatorContext'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/utils/cn'

export default function OccasionPage() {
  useSeo({
    title: 'Pick an Occasion — NxK Greetings',
    description: 'Birthday, love, friendship, congratulations and more — choose the feeling behind your cinematic greeting.',
    canonicalPath: '/occasion',
  })
  const { wizard, patch } = useCreator()
  const navigate = useNavigate()
  const location = useLocation()
  const preselect = (location.state as { preselect?: OccasionId } | null)?.preselect

  // Deep links from landing/footer can preselect an occasion.
  useEffect(() => {
    if (preselect && OCCASIONS.some((o) => o.id === preselect)) {
      patch({ occasion: preselect })
    }
  }, [preselect, patch])

  return (
    <WizardShell
      step="occasion"
      title="What are we celebrating?"
      subtitle="Pick the feeling. You can always change it later — everything autosaves."
      onNext={() => navigate('/templates')}
      nextDisabled={!wizard.occasion}
      nextLabel={wizard.occasion ? 'Choose a template' : 'Pick one to continue'}
      footerNote={wizard.occasion ? 'Saved to your draft ✓' : undefined}
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 stagger">
        {OCCASIONS.map((o) => {
          const selected = wizard.occasion === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => patch({ occasion: o.id })}
              aria-pressed={selected}
              className={cn(
                'group relative overflow-hidden rounded-3xl border p-4 text-left transition-all duration-300 press min-h-[128px] flex flex-col',
                selected
                  ? 'border-transparent shadow-[0_0_40px_-8px_rgba(139,92,246,0.55)] -translate-y-0.5 neon-border'
                  : 'border-line bg-white/3 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/5',
              )}
            >
              {/* gradient glow */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition-all duration-500',
                  selected ? 'opacity-60 scale-110' : 'opacity-20 group-hover:opacity-45',
                )}
                style={{ background: `linear-gradient(135deg, ${o.gradient[0]}, ${o.gradient[1]})` }}
              />
              <span
                className={cn(
                  'relative flex size-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-300 group-hover:scale-110',
                  selected && 'animate-heartbeat',
                )}
                style={{
                  background: `linear-gradient(135deg, ${o.gradient[0]}26, ${o.gradient[1]}18)`,
                  border: `1px solid ${o.gradient[0]}40`,
                }}
                aria-hidden="true"
              >
                {o.emoji}
              </span>
              <span className="relative mt-3 block font-display text-[15px] font-bold text-ink">{o.name}</span>
              <span className="relative mt-1 block text-[11.5px] leading-snug text-muted">{o.tagline}</span>
              {selected && (
                <span
                  className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                  style={{ background: `linear-gradient(135deg, ${o.gradient[0]}, ${o.gradient[1]})` }}
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </WizardShell>
  )
}
