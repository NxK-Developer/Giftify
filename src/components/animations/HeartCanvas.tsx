import { useEffect, useRef } from 'react'
import type { PerfTier, ThemeConfig } from '@/types'
import { HeartAnimation, type HeartPhase } from '@/animations/HeartAnimation'
import { cn } from '@/utils/cn'

export interface HeartCanvasProps {
  theme: ThemeConfig
  tier: PerfTier
  reducedMotion: boolean
  paused?: boolean
  phase: HeartPhase
  onFormed?: () => void
  onBurstDone?: () => void
  className?: string
}

/**
 * React wrapper around HeartAnimation — the mathematical heart formation.
 * The engine is created once; phase changes are pushed in, and callbacks
 * are kept in refs so they never go stale (and never re-create the engine).
 */
export default function HeartCanvas({
  theme,
  tier,
  reducedMotion,
  paused = false,
  phase,
  onFormed,
  onBurstDone,
  className,
}: HeartCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<HeartAnimation | null>(null)
  const formedRef = useRef(onFormed)
  const burstRef = useRef(onBurstDone)
  useEffect(() => {
    formedRef.current = onFormed
    burstRef.current = onBurstDone
  }, [onFormed, onBurstDone])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new HeartAnimation(
      canvas,
      { tier, reducedMotion },
      {
        theme,
        baseCount: 170,
        onFormed: () => formedRef.current?.(),
        onBurstDone: () => burstRef.current?.(),
      },
    )
    engineRef.current = engine
    engine.mount()
    engine.start()
    engine.setPhase('float')
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.id, tier, reducedMotion])

  useEffect(() => {
    engineRef.current?.setPhase(phase)
  }, [phase])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) engine.pause()
    else engine.resume()
  }, [paused])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('absolute inset-0 size-full', className)} />
}
