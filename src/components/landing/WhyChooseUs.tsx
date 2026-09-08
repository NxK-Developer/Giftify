import { Check, HeartHandshake } from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import { BRAND } from '@/constants/brand'

const REASONS = [
  'Nothing to install — a link is the whole experience',
  'No watermarks, no ads, no “upgrade to remove branding” traps',
  'Your message is sanitized and escaped; greetings can be private or password-locked',
  'Built for Android-first mobile: 60fps canvases, low-end device detection, data-saver aware',
  'Reduced-motion support — the surprise stays beautiful, never nauseating',
  'Runs entirely on free tiers: Firebase Auth, Firestore & Hosting. ₹0, honestly',
]

export default function WhyChooseUs() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="why-title">
      <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="text-xs font-bold tracking-[0.28em] text-success uppercase">Why choose us</p>
          <h2 id="why-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Made by people who’d want to <span className="text-gradient">receive this</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {REASONS.map((r) => (
              <li key={r} className="flex items-start gap-3.5 text-[14.5px] leading-relaxed text-ink-dim">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-success/30 bg-success/12 text-success" aria-hidden="true">
                  <Check className="size-3.5" />
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* NxK identity card — subtle, premium, not a portfolio */}
        <div className="glass-card relative overflow-hidden rounded-[2rem] p-7">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-48 rounded-full bg-brand/25 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-4">
              <NxKMonogram size="lg" />
              <div>
                <p className="font-display text-lg font-extrabold text-ink">{BRAND.name}</p>
                <p className="text-xs text-muted">{BRAND.tagline}</p>
              </div>
            </div>
            <p className="mt-6 text-sm leading-relaxed text-ink-dim">
              <HeartHandshake className="mr-1.5 inline size-4 text-accent-soft" aria-hidden="true" />
              We build small, emotional software with big-engineering discipline — performance budgets, security
              rules and accessibility baked in, not bolted on.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line bg-white/3 p-4">
                <p className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Founder</p>
                <p className="mt-1 font-display text-sm font-bold text-ink">{BRAND.founder}</p>
              </div>
              <div className="rounded-2xl border border-line bg-white/3 p-4">
                <p className="text-[10px] font-bold tracking-[0.18em] text-muted uppercase">Co-Founder</p>
                <p className="mt-1 font-display text-sm font-bold text-ink">{BRAND.coFounder}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
