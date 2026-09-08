import { Link } from 'react-router-dom'
import { Home, Wand2, Play, Compass } from 'lucide-react'
import ParticleBackground from '@/components/background/ParticleBackground'
import NxKMonogram from '@/components/common/NxKMonogram'
import Button from '@/components/common/Button'
import { useSeo } from '@/hooks/useSeo'
import { THEME_MAP } from '@/constants/themes'
import { BRAND, CREDIT_LINES } from '@/constants/brand'

const SUGGESTIONS = [
  { to: '/create', emoji: '🎁', label: 'Start a new greeting', note: '12 occasions, 18 cinematic templates' },
  { to: '/demo', emoji: '🎬', label: 'Watch the demo', note: 'A ready-made surprise, no sign-up' },
  { to: '/dashboard', emoji: '📊', label: 'Your dashboard', note: 'Everything you have created so far' },
]

export default function NotFoundPage() {
  useSeo({
    title: 'Page not found — NxK Greetings',
    description: 'That link does not exist (or its greeting was removed). Start a new cinematic greeting instead.',
    noindex: true,
  })
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-base">
      {/* Slow drifting stars — the 404 still feels like the product, not a dead end. */}
      <ParticleBackground theme={THEME_MAP.galaxy} baseCount={70} intensity={0.55} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(139,92,246,0.22),transparent_58%)]" aria-hidden="true" />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Link to="/" className="press" aria-label={`${BRAND.app} home`}>
          <NxKMonogram size="sm" />
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted transition hover:bg-white/5 hover:text-ink"
        >
          <Home className="size-3.5" aria-hidden="true" />
          Home
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        <p className="font-mono text-xs tracking-[0.4em] text-brand-soft uppercase animate-fade-up">Error 404</p>
        <h1 className="mt-4 font-display text-6xl leading-none font-black tracking-tight text-ink sm:text-8xl animate-fade-up">
          <span className="text-gradient">This scene</span>
          <br />
          never existed
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted animate-fade-up" style={{ animationDelay: '120ms' }}>
          The link you followed has faded out — maybe it was mistyped, maybe the greeting was deleted by its
          creator, or maybe it was set to private. Nothing is broken on our side.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <Button to="/create" size="lg" icon={<Wand2 className="size-4" />}>
            Create a greeting
          </Button>
          <Button to="/demo" variant="secondary" size="lg" icon={<Play className="size-4" />}>
            See a demo
          </Button>
        </div>

        <ul className="mt-12 grid w-full gap-3 sm:grid-cols-3 animate-fade-up" style={{ animationDelay: '280ms' }}>
          {SUGGESTIONS.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="glass-card flex h-full flex-col gap-1 rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20"
              >
                <span className="text-xl" aria-hidden="true">{s.emoji}</span>
                <span className="text-sm font-semibold text-ink">{s.label}</span>
                <span className="text-[11px] leading-relaxed text-muted">{s.note}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 flex items-center gap-1.5 text-xs text-muted">
          <Compass className="size-3.5 text-brand-soft" aria-hidden="true" />
          Looking for a greeting you received? Ask the sender to re-share the link — short links look like{' '}
          <code className="font-mono text-brand-soft">/g/Ab7Kx92</code>.
        </p>
      </main>

      <footer className="relative z-10 border-t border-line/60 bg-base-2/60 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center sm:px-6">
          {CREDIT_LINES.map((line) => (
            <p key={line} className="text-[11px] tracking-wide text-muted">
              {line}
            </p>
          ))}
        </div>
      </footer>
    </div>
  )
}
