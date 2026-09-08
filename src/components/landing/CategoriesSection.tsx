import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { OCCASIONS } from '@/constants/occasions'

export default function CategoriesSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="cats-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.28em] text-accent-soft uppercase">Greeting categories</p>
          <h2 id="cats-title" className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Every feeling deserves a <span className="text-gradient">cinematic entrance</span>
          </h2>
        </div>
        <Link
          to="/occasion"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-soft transition hover:text-accent-soft"
        >
          Browse all
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {OCCASIONS.map((o, i) => (
          <Link
            key={o.id}
            to="/occasion"
            state={{ preselect: o.id }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-white/3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}
            aria-label={`Create a ${o.name} greeting`}
          >
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 size-24 rounded-full opacity-25 blur-2xl transition-all duration-500 group-hover:opacity-60 group-hover:scale-125"
              style={{ background: `linear-gradient(135deg, ${o.gradient[0]}, ${o.gradient[1]})` }}
            />
            <span className="relative block text-2xl transition-transform duration-300 group-hover:scale-115" aria-hidden="true">
              {o.emoji}
            </span>
            <span className="relative mt-2.5 block font-display text-sm font-bold text-ink">{o.name}</span>
            <span className="relative mt-0.5 block text-[11px] leading-snug text-muted">{o.tagline}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
