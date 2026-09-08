import { useEffect, useRef } from 'react'
import type { AnimationStyleConfig, PerfTier, ThemeConfig } from '@/types'
import { THEME_MAP } from '@/constants/themes'
import { ConfettiAnimation } from '@/animations/ConfettiAnimation'
import { FlowerAnimation } from '@/animations/FlowerAnimation'
import { ParticleEngine } from '@/animations/ParticleEngine'
import { MatrixEngine } from '@/animations/MatrixEngine'
import { cn } from '@/utils/cn'

type Engine = ConfettiAnimation | FlowerAnimation | ParticleEngine | MatrixEngine

export interface FlourishCanvasProps {
  style: AnimationStyleConfig
  theme: ThemeConfig
  tier: PerfTier
  reducedMotion: boolean
  paused?: boolean
  className?: string
}

/**
 * The "special animation" stage flourish, chosen by AnimationStyleConfig:
 * confetti cannons, blooming flowers, rising hearts, glyph cascade or a
 * central sparkle burst. Mounts, fires once, keeps animating until unmounted.
 */
export default function FlourishCanvas({
  style,
  theme,
  tier,
  reducedMotion,
  paused = false,
  className,
}: FlourishCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const settings = { tier, reducedMotion }
    let engine: Engine

    switch (style.flourish) {
      case 'confetti': {
        const c = new ConfettiAnimation(canvas, settings, { theme, ambient: false })
        engineRef.current = c
        c.mount()
        c.start()
        // Fire the cannons once the canvas has real dimensions
        requestAnimationFrame(() => {
          c.celebrate(reducedMotion ? 26 : 80)
          window.setTimeout(() => c.celebrate(reducedMotion ? 14 : 46), 550)
        })
        engine = c
        break
      }
      case 'petals': {
        const f = new FlowerAnimation(canvas, settings, { theme, flowerCount: 8, petalCount: 30 })
        engineRef.current = f
        f.mount()
        f.start()
        engine = f
        break
      }
      case 'hearts': {
        const p = new ParticleEngine(canvas, settings, {
          theme: { ...theme, particleKind: 'hearts' },
          baseCount: 60,
          intensity: 1.5,
        })
        engineRef.current = p
        p.mount()
        p.start()
        engine = p
        break
      }
      case 'glyphs': {
        const m = new MatrixEngine(canvas, settings, { theme: theme.id === 'matrix' ? theme : THEME_MAP.matrix, density: 1.25, speed: 1.8 })
        engineRef.current = m
        m.mount()
        m.start()
        engine = m
        break
      }
      case 'sparkles':
      default: {
        const c = new ConfettiAnimation(canvas, settings, { theme, ambient: false })
        engineRef.current = c
        c.mount()
        c.start()
        requestAnimationFrame(() => {
          // Center sparkle burst + two soft side pops
          c.burst(window.innerWidth / 2, window.innerHeight * 0.42, reducedMotion ? 16 : 54, Math.PI * 2)
          window.setTimeout(() => c.burst(window.innerWidth * 0.2, window.innerHeight * 0.6, 24, Math.PI), 400)
          window.setTimeout(() => c.burst(window.innerWidth * 0.8, window.innerHeight * 0.6, 24, Math.PI), 650)
        })
        engine = c
        break
      }
    }

    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style.flourish, theme.id, tier, reducedMotion])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) engine.pause()
    else engine.resume()
  }, [paused])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('absolute inset-0 size-full', className)} />
}
