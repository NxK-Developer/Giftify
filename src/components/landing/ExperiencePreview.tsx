import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Radio } from 'lucide-react'
import { HeartAnimation } from '@/animations/HeartAnimation'
import { THEME_MAP } from '@/constants/themes'
import { useSettings } from '@/store/SettingsContext'
import { usePageVisibility } from '@/hooks/usePageVisibility'

/**
 * Mini looping heart-formation preview rendered inside a phone mockup.
 * Runs only while on-screen AND the tab is visible; paused otherwise.
 */
function MiniHeartCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<HeartAnimation | null>(null)
  const phaseTimer = useRef<number | null>(null)
  const { tier, reducedMotion } = useSettings()
  const tabVisible = usePageVisibility()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new HeartAnimation(canvas, { tier, reducedMotion }, { theme: THEME_MAP.heart, baseCount: 120 })
    engineRef.current = engine
    engine.mount()
    engine.start()
    return () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current)
      engine.destroy()
      engineRef.current = null
    }
  }, [tier, reducedMotion])

  // Phase loop: float → gather → formed (hold) → burst → repeat
  useEffect(() => {
    if (!active || !tabVisible) {
      engineRef.current?.pause()
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current)
      return
    }
    engineRef.current?.resume()
    if (reducedMotion) {
      engineRef.current?.setPhase('gather') // snaps to formed with soft breathe
      return
    }

    const runCycle = () => {
      const engine = engineRef.current
      if (!engine) return
      engine.setPhase('float')
      phaseTimer.current = window.setTimeout(() => {
        engine.setPhase('gather')
        phaseTimer.current = window.setTimeout(() => {
          engine.setPhase('burst')
          phaseTimer.current = window.setTimeout(runCycle, 2200)
        }, 5200)
      }, 1800)
    }
    runCycle()
    return () => {
      if (phaseTimer.current) window.clearTimeout(phaseTimer.current)
    }
  }, [active, tabVisible, reducedMotion])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <span className="sr-only" role="status">
        Preview: particles gathering into a glowing heart
      </span>
    </>
  )
}

export default function ExperiencePreview() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24" aria-labelledby="exp-title">
      <div ref={containerRef} className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <div className="order-2 lg:order-1">
          <p className="text-xs font-bold tracking-[0.28em] text-neon uppercase">Cinematic experience preview</p>
          <h2 id="exp-title" className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            It doesn’t open like a website.
            <br />
            <span className="text-gradient">It unfolds like a surprise.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Your recipient taps once — a terminal boots, particles wake up, and hundreds of points of light
            gather into a beating heart before their name appears. No navbar, no clutter, no “website smell”.
            Just a full-screen moment made for one person.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink-dim">
            {[
              ['💻', 'Cinematic code intro with scanlines & matrix rain'],
              ['💗', 'Mathematical heart formation — particles to pulse'],
              ['✍️', 'Typewriter message reveal with blur-to-focus'],
              ['🎵', 'Generative soundtrack that never repeats exactly'],
            ].map(([emoji, text]) => (
              <li key={text} className="flex items-center gap-3">
                <span aria-hidden="true">{emoji}</span>
                {text}
              </li>
            ))}
          </ul>
          <Link
            to="/demo"
            className="mt-8 inline-flex min-h-12 items-center gap-2.5 rounded-2xl bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] px-6 text-sm font-semibold text-white shadow-[0_10px_34px_-10px_rgba(236,72,153,0.65)] transition hover:brightness-110 press"
          >
            <Play className="size-4 fill-white" aria-hidden="true" />
            Watch the full demo
          </Link>
        </div>

        {/* Phone mockup */}
        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-[3.5rem] bg-[radial-gradient(closest-side,rgba(236,72,153,0.22),transparent)] blur-2xl"
            />
            <div className="relative aspect-[9/18] w-[min(74vw,300px)] rounded-[2.6rem] border border-white/14 bg-[#0b0413] p-2.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_60px_-15px_rgba(236,72,153,0.35)]">
              {/* notch */}
              <div aria-hidden="true" className="absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/85" />
              <div className="scanlines relative size-full overflow-hidden rounded-[2.1rem] bg-[radial-gradient(120%_90%_at_50%_0%,#2a0a18_0%,#12040c_55%,#0b0413_100%)]">
                <MiniHeartCanvas active={inView} />
                {/* mock overlay UI */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 pb-7 text-center">
                  <p className="rounded-full border border-white/12 bg-black/35 px-3.5 py-1.5 font-script text-lg text-rose-100 backdrop-blur">
                    Hey, Aarav ❤️
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-[9px] tracking-widest text-rose-200/60 uppercase">
                    <Radio className="size-2.5 animate-pulse" aria-hidden="true" /> live preview · sample data
                  </p>
                </div>
                <div className="pointer-events-none absolute inset-x-0 top-9 z-10 flex justify-center">
                  <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[8px] tracking-[0.25em] text-white/55 uppercase backdrop-blur">
                    nxk surprise engine
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
