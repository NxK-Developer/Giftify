import type { PerfTier } from '@/types'

/**
 * Performance mode system: high / medium / low.
 * Auto-detected from device signals, overridable by the user in Settings,
 * and refined at runtime by an FPS probe.
 */

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number
  connection?: { effectiveType?: string; saveData?: boolean }
}

export interface QualityProfile {
  /** Multiplier applied to base particle counts */
  particleScale: number
  /** devicePixelRatio ceiling for canvases */
  dprCap: number
  /** Enable expensive effects (per-shape shadows, trails) */
  fancy: boolean
}

export const QUALITY: Record<PerfTier, QualityProfile> = {
  high: { particleScale: 1, dprCap: 2, fancy: true },
  medium: { particleScale: 0.55, dprCap: 1.5, fancy: true },
  low: { particleScale: 0.28, dprCap: 1, fancy: false },
}

export function detectPerfTier(): PerfTier {
  if (typeof navigator === 'undefined') return 'medium'
  const nav = navigator as NavigatorWithHints
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const conn = nav.connection

  // Respect data-saver explicitly.
  if (conn?.saveData) return 'low'

  let score = 0
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0
  if (conn?.effectiveType === '4g' || !conn?.effectiveType) score += 1
  if (conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') score -= 2
  // Small screens usually mean weaker GPUs; large desktops get a boost.
  if (typeof screen !== 'undefined' && screen.width >= 1280) score += 1

  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

/**
 * Runtime FPS probe: measures frames over `durationMs` and suggests a tier.
 * Used once after the experience starts; cheap and unobtrusive.
 */
export class FpsProbe {
  private raf = 0
  private frames = 0
  private startedAt = 0
  private done = false

  start(durationMs: number, onResult: (fps: number) => void): void {
    if (this.done) return
    this.frames = 0
    this.startedAt = performance.now()
    const tick = () => {
      this.frames++
      const elapsed = performance.now() - this.startedAt
      if (elapsed >= durationMs) {
        this.done = true
        onResult(Math.round((this.frames / elapsed) * 1000))
        return
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop(): void {
    cancelAnimationFrame(this.raf)
    this.done = true
  }
}

export function tierFromFps(fps: number, current: PerfTier): PerfTier {
  if (fps >= 50) return 'high'
  if (fps >= 32) return current === 'low' ? 'low' : 'medium'
  return 'low'
}
