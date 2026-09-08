import { useEffect, useRef } from 'react'
import type { ThemeConfig } from '@/types'
import { THEME_MAP } from '@/constants/themes'
import { ParticleEngine } from '@/animations/ParticleEngine'
import { useSettings } from '@/store/SettingsContext'
import { cn } from '@/utils/cn'

export interface ParticleBackgroundProps {
  theme?: ThemeConfig
  baseCount?: number
  intensity?: number
  className?: string
  /** Pause the engine (e.g. when a heavier foreground animation runs) */
  paused?: boolean
}

/**
 * Ambient themed particle canvas — stars on the landing hero, petals for
 * blossom pages, glyphs for matrix moments. Engine-driven (rAF), tier-aware,
 * reduced-motion aware, and fully paused when the tab is hidden.
 */
export default function ParticleBackground({
  theme = THEME_MAP.galaxy,
  baseCount = 110,
  intensity = 1,
  className,
  paused = false,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<ParticleEngine | null>(null)
  const { tier, reducedMotion } = useSettings()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new ParticleEngine(
      canvas,
      { tier, reducedMotion, intensity },
      { theme, baseCount },
    )
    engineRef.current = engine
    engine.mount()
    engine.start()
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // Theme object identity is stable (from THEME_MAP); re-create only on
    // meaningful changes to avoid canvas churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.id, baseCount, tier, reducedMotion, intensity])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) engine.pause()
    else engine.resume()
  }, [paused])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
  )
}
