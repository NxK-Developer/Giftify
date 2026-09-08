import { Link } from 'react-router-dom'
import { Target, LayoutTemplate, PenLine, Palette, Link2 } from 'lucide-react'

const STEPS = [
  {
    icon: Target,
    title: 'Pick an occasion',
    text: 'Birthday, love, friendship, sorry, festivals — 12 ways to say it right.',
    to: '/occasion',
  },
  {
    icon: LayoutTemplate,
    title: 'Choose a template',
    text: 'Cinematic, romantic, playful or minimal — each pre-tuned with theme, animation and music.',
    to: '/templates',
  },
  {
    icon: PenLine,
    title: 'Personalize it',
    text: 'Names, a nickname, your own words, emoji and even a special date.',
    to: '/personalize',
  },
  {
    icon: Palette,
    title: 'Set the mood',
    text: 'Seven visual themes, six animation styles and generative soundtracks.',
    to: '/theme',
  },
  {
    icon: Link2,
    title: 'Generate & share',
    text: 'One tap creates a unique link + QR code. WhatsApp it, share it, done.',
    to: '/preview',
  },
]

export default function HowItWorks() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="how-title">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-[0.28em] text-brand-soft uppercase">How it works</p>
        <h2 id="how-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Five steps to a <span className="text-gradient">digital surprise</span>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          No design skills, no accounts required to start. Your greeting becomes a cinematic experience in
          about two minutes.
        </p>
      </div>

      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <Link
              to={s.to}
              className="glass-card group relative flex h-full flex-col rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-soft/40 hover:shadow-[0_20px_60px_-20px_rgba(139,92,246,0.5)]"
            >
              <span
                className="absolute right-4 top-4 font-mono text-xs font-bold text-muted/50 transition-colors group-hover:text-brand-soft"
                aria-hidden="true"
              >
                0{i + 1}
              </span>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-brand/25 bg-brand/12 text-brand-soft shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-transform duration-300 group-hover:scale-110">
                <s.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-[15px] font-bold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{s.text}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
