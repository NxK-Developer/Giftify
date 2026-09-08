import { useNavigate } from 'react-router-dom'
import WizardShell from '@/components/creator/WizardShell'
import { THEMES } from '@/constants/themes'
import { useCreator } from '@/store/CreatorContext'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/utils/cn'

export default function ThemePage() {
  useSeo({
    title: 'Choose a Theme — NxK Greetings',
    description: 'Galaxy, Blossom, Heart, Matrix, Sunset, Celebration or Minimal — seven cinematic visual themes with their own particles and glow.',
    canonicalPath: '/theme',
  })
  const { wizard, patch } = useCreator()
  const navigate = useNavigate()

  return (
    <WizardShell
      step="theme"
      title="Choose the world it lives in 🎨"
      subtitle="Each theme brings its own colors, particles and glow to the recipient’s screen."
      onNext={() => navigate('/animation')}
      nextDisabled={!wizard.theme}
      nextLabel="Pick animation"
      footerNote={wizard.theme ? 'Saved to your draft ✓' : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {THEMES.map((t) => {
          const selected = wizard.theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => patch({ theme: t.id })}
              aria-pressed={selected}
              className={cn(
                'group relative overflow-hidden rounded-3xl border text-left transition-all duration-300 press',
                selected
                  ? 'border-transparent -translate-y-0.5 neon-border shadow-[0_0_48px_-10px_rgba(167,139,250,0.65)]'
                  : 'border-line hover:-translate-y-0.5 hover:border-white/20',
              )}
            >
              {/* Theme sky preview */}
              <span
                aria-hidden="true"
                className="relative block h-36 overflow-hidden"
                style={{
                  background: `radial-gradient(130% 140% at 25% -10%, ${t.background[2]}, ${t.background[0]} 55%, ${t.base})`,
                }}
              >
                {t.particleColors.slice(0, 6).map((c, i) => (
                  <span
                    key={c + i}
                    className="absolute rounded-full animate-twinkle"
                    style={{
                      width: 3 + (i % 3) * 2.5,
                      height: 3 + (i % 3) * 2.5,
                      background: c,
                      boxShadow: `0 0 10px ${c}`,
                      left: `${8 + ((i * 37) % 84)}%`,
                      top: `${12 + ((i * 53) % 66)}%`,
                      animationDelay: `${i * 0.35}s`,
                    }}
                  />
                ))}
                {/* glow blob in the theme accent */}
                <span
                  className="absolute -bottom-10 left-1/2 size-28 -translate-x-1/2 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125"
                  style={{ background: t.glow }}
                />
                <span className="absolute bottom-3 left-4 text-2xl drop-shadow-lg">{t.emoji}</span>
                {selected && (
                  <span
                    className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                    style={{ background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})` }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </span>

              <span className="block bg-[#0d0820]/85 p-4 backdrop-blur">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-[15px] font-bold" style={{ color: t.accent }}>
                    {t.name}
                  </span>
                  <span className="flex gap-1" aria-hidden="true">
                    {t.particleColors.slice(0, 4).map((c) => (
                      <span key={c} className="size-2.5 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-muted">{t.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </WizardShell>
  )
}
