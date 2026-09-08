import { Link } from 'react-router-dom'
import { Sparkles, Play, Heart } from 'lucide-react'
import Button from '@/components/common/Button'
import ParticleBackground from '@/components/background/ParticleBackground'
import GradientBlobs from '@/components/background/GradientBlobs'
import { BRAND } from '@/constants/brand'
import { THEME_MAP } from '@/constants/themes'
import { SAMPLE_GREETINGS } from '@/constants/samples'
import { getOccasion } from '@/constants/occasions'
import { useSettings } from '@/store/SettingsContext'
import { cn } from '@/utils/cn'

/** CSS-only floating hearts layer (cheap, no canvas needed). */
function FloatingHearts() {
  const { reducedMotion } = useSettings()
  if (reducedMotion) return null
  const hearts = [
    { left: '6%', size: 14, delay: '0s', dur: '13s', op: 0.5 },
    { left: '18%', size: 9, delay: '3.5s', dur: '16s', op: 0.35 },
    { left: '34%', size: 12, delay: '7s', dur: '14s', op: 0.4 },
    { left: '57%', size: 8, delay: '2s', dur: '17s', op: 0.3 },
    { left: '72%', size: 15, delay: '5.5s', dur: '12s', op: 0.45 },
    { left: '88%', size: 10, delay: '8.5s', dur: '15s', op: 0.35 },
  ]
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {hearts.map((h, i) => (
        <Heart
          key={i}
          className="absolute bottom-[-8%] fill-accent/70 text-accent"
          style={{
            left: h.left,
            width: h.size,
            height: h.size,
            opacity: h.op,
            animation: `rise ${h.dur} linear ${h.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pt-32" aria-label="Hero">
      {/* Layered cinematic background */}
      <GradientBlobs />
      <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <ParticleBackground theme={THEME_MAP.galaxy} baseCount={130} intensity={0.9} />
      </div>
      <FloatingHearts />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex animate-fade-up items-center gap-2 rounded-full border border-line-strong bg-white/5 py-1.5 pl-2 pr-4 text-xs font-medium text-ink-dim backdrop-blur">
            <span className="flex size-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] text-[10px] text-white">
              ✨
            </span>
            Free forever · No app install · Cinematic by design
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display text-[2.6rem] font-extrabold leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '0.08s' }}
          >
            <span className="block text-ink">Make Someone’s</span>
            <span className="text-gradient bg-[length:200%_auto] animate-gradient-shift block">
              Day Special ✨
            </span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl animate-fade-up text-[15px] leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: '0.16s' }}
          >
            {BRAND.heroSubtitle} Hearts that form from stardust, a cinematic code intro, music that
            feels like a memory — delivered through one magical link.
          </p>

          {/* CTAs */}
          <div
            className="mt-8 flex animate-fade-up flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: '0.24s' }}
          >
            <Button to="/create" size="lg" className="sweep-once sm:min-w-52" icon={<Sparkles className="size-5" />}>
              Create a Greeting
            </Button>
            <Button to="/demo" size="lg" variant="secondary" className="sm:min-w-44" icon={<Play className="size-4.5" />}>
              Watch Demo
            </Button>
          </div>

          <p className="mt-5 animate-fade-up text-xs text-muted" style={{ animationDelay: '0.3s' }}>
            🎂 Birthday · ❤️ Love · 🤝 Friendship · 🏆 Congratulations · +8 more occasions
          </p>
        </div>

        {/* Example greeting cards — real samples, tap to experience one */}
        <div className="mt-14 grid animate-fade-up gap-4 sm:mt-16 sm:grid-cols-3" style={{ animationDelay: '0.36s' }}>
          {SAMPLE_GREETINGS.map((g, i) => {
            const occasion = getOccasion(g.occasion)
            const theme = THEME_MAP[g.theme]
            return (
              <Link
                key={g.id}
                to={`/g/${g.id}`}
                className={cn(
                  'glass-card group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300',
                  'hover:-translate-y-1.5 hover:shadow-[0_26px_70px_-18px_rgba(139,92,246,0.5)]',
                  i === 1 ? 'sm:-mt-4 sm:mb-4' : '',
                )}
                aria-label={`Open sample greeting for ${g.recipientName}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-85"
                  style={{
                    background: `radial-gradient(70% 120% at 50% 0%, ${theme.glow}, transparent)`,
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex size-11 items-center justify-center rounded-2xl text-xl"
                      style={{
                        background: `linear-gradient(135deg, ${occasion.gradient[0]}33, ${occasion.gradient[1]}22)`,
                        border: `1px solid ${occasion.gradient[0]}44`,
                      }}
                      aria-hidden="true"
                    >
                      {occasion.emoji}
                    </span>
                    <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
                      Sample
                    </span>
                  </div>
                  <p className="mt-4 font-display text-[15px] font-bold text-ink">
                    For {g.recipientName} {g.id === 'Meera02' && '❤️'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">{g.message}</p>
                  <p
                    className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                    style={{ color: theme.accent }}
                  >
                    {theme.emoji} {theme.name} · {occasion.name}
                    <span className="opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                      →
                    </span>
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
