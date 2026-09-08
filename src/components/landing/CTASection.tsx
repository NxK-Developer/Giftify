import { Sparkles } from 'lucide-react'
import Button from '@/components/common/Button'

export default function CTASection() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6" aria-labelledby="cta-title">
      <div className="glass-card relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center sm:px-14 sm:py-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_-20%,rgba(139,92,246,0.28),transparent_60%)]"
        />
        <div aria-hidden="true" className="grid-overlay absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="text-3xl" aria-hidden="true">🎁</p>
          <h2 id="cta-title" className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.6rem]">
            Someone is about to have a <span className="text-gradient">very good day</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Two minutes from now, you’ll be holding a link that makes a heart out of stardust. All it needs is
            a name and a few honest words.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button to="/create" size="lg" className="sweep-once sm:min-w-56" icon={<Sparkles className="size-5" />}>
              Create a Greeting — Free
            </Button>
            <Button to="/demo" size="lg" variant="ghost">
              Or see one first →
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
