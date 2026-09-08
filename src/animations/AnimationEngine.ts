import type { PerfTier } from '@/types'
import { QUALITY } from './perf'
import { fitCanvas } from './canvasUtils'

/**
 * AnimationEngine — the base class every canvas engine extends.
 *
 * Responsibilities:
 *  - requestAnimationFrame loop with clamped delta time
 *  - automatic pause when the tab is hidden (no wasted CPU, ever)
 *  - external pause/resume (recipient experience controls)
 *  - DPR-aware resizing via ResizeObserver
 *  - performance tier + reduced-motion awareness
 *  - guaranteed cleanup in destroy()
 */
export interface EngineSettings {
  tier: PerfTier
  reducedMotion: boolean
  /** Global intensity multiplier (0..1.5) for stage dynamics */
  intensity?: number
}

export abstract class AnimationEngine {
  protected canvas: HTMLCanvasElement
  protected ctx: CanvasRenderingContext2D | null
  protected w = 0
  protected h = 0
  protected dpr = 1
  protected settings: EngineSettings
  protected running = false
  protected paused = false
  private rafId = 0
  private lastTime = 0
  private elapsed = 0
  private resizeObserver: ResizeObserver | null = null
  private visibilityHandler: (() => void) | null = null

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: true })
    this.settings = settings
  }

  get quality() {
    return QUALITY[this.settings.tier]
  }

  get reducedMotion(): boolean {
    return this.settings.reducedMotion
  }

  mount(): void {
    this.resize()
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize())
      const parent = this.canvas.parentElement
      if (parent) this.resizeObserver.observe(parent)
      else this.resizeObserver.observe(this.canvas)
    } else {
      window.addEventListener('resize', this.handleWindowResize)
    }
    this.visibilityHandler = () => {
      if (document.hidden) this.stopLoop()
      else if (this.running && !this.paused) this.startLoop()
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  destroy(): void {
    this.stopLoop()
    this.running = false
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
    window.removeEventListener('resize', this.handleWindowResize)
    this.onCleanup?.()
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.elapsed = 0
    this.onStart?.()
    if (!document.hidden && !this.paused) this.startLoop()
  }

  pause(): void {
    this.paused = true
    this.stopLoop()
  }

  resume(): void {
    this.paused = false
    if (this.running && !document.hidden) this.startLoop()
  }

  updateSettings(patch: Partial<EngineSettings>): void {
    const tierChanged = patch.tier !== undefined && patch.tier !== this.settings.tier
    this.settings = { ...this.settings, ...patch }
    if (tierChanged) this.onTierChanged?.()
    if (patch.reducedMotion !== undefined) this.onReducedMotionChanged?.()
  }

  protected resize(): void {
    const dims = fitCanvas(this.canvas, this.quality.dprCap)
    const changed = dims.w !== this.w || dims.h !== this.h
    this.w = dims.w
    this.h = dims.h
    this.dpr = dims.dpr
    if (changed) this.onResize?.()
  }

  private handleWindowResize = (): void => this.resize()

  private startLoop(): void {
    if (this.rafId) return
    this.lastTime = performance.now()
    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick)
      // Clamp dt so tab-switches/long frames don't explode physics.
      const dt = Math.min((now - this.lastTime) / 1000, 0.05)
      this.lastTime = now
      this.elapsed += dt
      this.update(dt, this.elapsed)
      this.draw(this.elapsed)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private stopLoop(): void {
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  /** Paint one static frame (used for reduced-motion and paused previews). */
  renderStatic(): void {
    this.resize()
    this.update(0, this.elapsed)
    this.draw(this.elapsed)
  }

  protected abstract update(dt: number, t: number): void
  protected abstract draw(t: number): void

  protected onStart?(): void
  protected onResize?(): void
  protected onCleanup?(): void
  protected onTierChanged?(): void
  protected onReducedMotionChanged?(): void

  protected clear(): void {
    this.ctx?.clearRect(0, 0, this.w, this.h)
  }
}
