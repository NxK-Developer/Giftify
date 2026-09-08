import { Link } from 'react-router-dom'
import { Heart, Sparkles } from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import { BRAND } from '@/constants/brand'
import { OCCASIONS } from '@/constants/occasions'

/** lucide dropped brand glyphs — the GitHub mark stays hand-inlined. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

const PRODUCT_LINKS = [
  { to: '/create', label: 'Create a Greeting' },
  { to: '/demo', label: 'Watch Demo' },
  { to: '/templates', label: 'Templates' },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="relative mt-24 border-t border-line bg-[linear-gradient(180deg,transparent,rgba(139,92,246,0.05))]">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <NxKMonogram size="md" />
              <div>
                <p className="font-display text-base font-bold text-ink">{BRAND.app}</p>
                <p className="text-xs text-muted">{BRAND.tagline}</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              A cinematic digital surprise generator — hearts, particles, music and a unique link your person
              will never forget. Free forever, no app installs, no watermarks.
            </p>
            <Link
              to="/create"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-soft transition hover:text-accent-soft"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Start creating — it takes 2 minutes
            </Link>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <p className="mb-3.5 text-xs font-bold tracking-[0.2em] text-muted uppercase">Product</p>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-ink-dim transition hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Occasions */}
          <nav aria-label="Occasions">
            <p className="mb-3.5 text-xs font-bold tracking-[0.2em] text-muted uppercase">Occasions</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {OCCASIONS.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <Link
                    to="/occasion"
                    state={{ preselect: o.id }}
                    className="text-sm text-ink-dim transition hover:text-ink"
                  >
                    {o.emoji} {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Credits bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-line pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs leading-relaxed text-muted">
            © {year} <span className="font-semibold text-ink-dim">{BRAND.name}</span> · Founder:{' '}
            <span className="font-semibold text-ink-dim">{BRAND.founder}</span> · Co-Founder:{' '}
            <span className="font-semibold text-ink-dim">{BRAND.coFounder}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            Made with <Heart className="size-3.5 fill-accent text-accent" aria-hidden="true" /> in India
            <GithubMark className="ml-2 size-3.5 opacity-60" />
          </p>
        </div>
      </div>
    </footer>
  )
}
