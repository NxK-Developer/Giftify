import { useEffect, useRef } from 'react'
import type { ThemeConfig } from '@/types'
import { MatrixEngine } from '@/animations/MatrixEngine'
import { cn } from '@/utils/cn'
import type { PerfTier } from '@/types'

export interface MatrixCanvasProps {
  theme: ThemeConfig
  tier: PerfTier
  reducedMotion: boolean
  paused?: boolean
  density?: number
  speed?: number
  className?: string
}

/** React wrapper around MatrixEngine (digital rain). */
export default function MatrixCanvas({
  theme,
  tier,
  reducedMotion,
  paused = false,
  density = 1,
  speed = 1,
  className,
}: MatrixCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<MatrixEngine | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new MatrixEngine(canvas, { tier, reducedMotion }, { theme, density, speed })
    engineRef.current = engine
    engine.mount()
    engine.start()
    return () => {
      engine.destroy()
      engineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme.id, tier, reducedMotion, density, speed])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) engine.pause()
    else engine.resume()
  }, [paused])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('absolute inset-0 size-full', className)} />
}
