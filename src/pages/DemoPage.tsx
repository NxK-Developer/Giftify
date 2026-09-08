import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, FlaskConical, ArrowLeft } from 'lucide-react'
import type { Greeting } from '@/types'
import Navbar from '@/components/landing/Navbar'
import Footer from '@/components/landing/Footer'
import GradientBlobs from '@/components/background/GradientBlobs'
import RecipientExperience from '@/components/recipient/RecipientExperience'
import { SAMPLE_GREETINGS } from '@/constants/samples'
import { getOccasion } from '@/constants/occasions'
import { getTheme } from '@/constants/themes'
import { useSeo } from '@/hooks/useSeo'

/**
 * /demo — explore the recipient experience with fictional sample data.
 * Works in every mode (Firebase or not). Clearly labeled as demo, with no
 * view/share tracking and nothing pretending to be saved.
 */
export default function DemoPage() {
  useSeo({
    title: 'Watch the Demo — NxK Greetings',
    description: 'Experience a full cinematic greeting with sample data: code intro, heart formation, typewriter message and finale.',
    canonicalPath: '/demo',
  })
  const [playing, setPlaying] = useState<Greeting | null>(null)

  if (playing) {
    return (
      <div className="fixed inset-0">
        <RecipientExperience
          key={playing.id}
          greeting={playing}
          preview
          onExit={() => setPlaying(null)}
        />
        <span className="absolute left-1/2 top-4 z-40 -translate-x-1/2 rounded-full border border-gold/30 bg-black/55 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-gold uppercase backdrop-blur">
          Demo · sample data
        </span>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh">
      <GradientBlobs minimal />
      <Navbar />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-28 sm:px-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-ink">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back home
        </Link>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Watch a <span className="text-gradient">full demo</span> 🎬
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
          These are fictional sample greetings (no real people, no real data). Tap one to experience exactly
          what your recipient will see — the code intro, the heart formation, the message reveal, everything.
        </p>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/8 px-3.5 py-1.5 text-xs font-semibold text-gold">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          Demo data — nothing here is tracked or saved
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {SAMPLE_GREETINGS.map((g) => {
            const occasion = getOccasion(g.occasion)
            const theme = getTheme(g.theme)
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setPlaying(g)}
                className="glass-card group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_70px_-18px_rgba(139,92,246,0.5)] press"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-24 opacity-45 blur-2xl transition-opacity group-hover:opacity-80"
                  style={{ background: `radial-gradient(70% 120% at 50% 0%, ${theme.glow}, transparent)` }}
                />
                <span className="relative flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">{occasion.emoji}</span>
                  <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition group-hover:bg-[linear-gradient(120deg,#8b5cf6,#ec4899)]" aria-hidden="true">
                    <Play className="size-4 fill-current" />
                  </span>
                </span>
                <span className="relative mt-4 block font-display text-[15px] font-bold text-ink">
                  For {g.recipientName}
                </span>
                <span className="relative mt-1 block line-clamp-2 text-[12.5px] leading-relaxed text-muted">
                  {g.message}
                </span>
                <span className="relative mt-3 block text-[11px] font-semibold" style={{ color: theme.accent }}>
                  {theme.emoji} {theme.name} · {occasion.name}
                </span>
              </button>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  )
}
