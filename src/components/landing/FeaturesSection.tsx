import { Terminal, HeartPulse, Palette, AudioLines, QrCode, ShieldCheck, Smartphone, IndianRupee } from 'lucide-react'

const FEATURES = [
  {
    icon: Terminal,
    tone: '#4ade80',
    title: 'Cinematic code intro',
    text: 'A terminal-style boot sequence with scanlines and matrix rain opens every surprise. Pure theatre — it never touches real systems.',
  },
  {
    icon: HeartPulse,
    tone: '#fb7185',
    title: 'Mathematical heart engine',
    text: 'Particles gather along a real parametric heart curve, lock in, and beat with a lub-dub pulse before the reveal.',
  },
  {
    icon: Palette,
    tone: '#a78bfa',
    title: 'Seven living themes',
    text: 'Galaxy, Blossom, Heart, Matrix, Sunset, Celebration and Minimal — each with its own particles, palette and glow.',
  },
  {
    icon: AudioLines,
    tone: '#22d3ee',
    title: 'Generative soundtracks',
    text: 'Music is composed live in your browser with the Web Audio API — royalty-free by construction, zero megabytes, works offline.',
  },
  {
    icon: QrCode,
    tone: '#fbbf24',
    title: 'QR + Web Share built in',
    text: 'QR codes generated locally (no paid services), native share sheet, WhatsApp/X links and one-tap copy fallback.',
  },
  {
    icon: ShieldCheck,
    tone: '#34d399',
    title: 'Privacy that means it',
    text: 'Public, unlisted or private greetings. Optional password lock (PBKDF2-hashed), scheduling and expiry — enforced by Firestore rules.',
  },
  {
    icon: Smartphone,
    tone: '#f9a8d4',
    title: 'Mobile-first PWA',
    text: 'Installs to the home screen, works from 320px up, respects reduced-motion, and never runs heavy animation on a hidden tab.',
  },
  {
    icon: IndianRupee,
    tone: '#fda4af',
    title: '₹0 forever architecture',
    text: 'Firebase Auth + Firestore + Hosting free tiers, procedural assets, zero paid APIs. Free to run, free to use.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="feat-title">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold tracking-[0.28em] text-gold uppercase">Features</p>
        <h2 id="feat-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Engineered to feel like <span className="text-gradient">magic</span>
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Every effect is procedural — canvas math, Web Audio synthesis and CSS light. No stock templates, no
          heavyweight assets, nothing generic.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="glass-card group rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 7) * 0.05}s` }}
          >
            <span
              className="flex size-11 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110"
              style={{
                color: f.tone,
                borderColor: `${f.tone}40`,
                background: `${f.tone}14`,
                boxShadow: `0 0 22px ${f.tone}22`,
              }}
              aria-hidden="true"
            >
              <f.icon className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-[15px] font-bold text-ink">{f.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
