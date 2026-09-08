import type { ThemeConfig } from '@/types'
import { AnimationEngine, type EngineSettings } from './AnimationEngine'
import {
  rand,
  pick,
  clamp,
  lerp,
  easeOutCubic,
  glowSprite,
  heartCurvePoint,
  heartPath,
} from './canvasUtils'

/**
 * HeartAnimation — the signature mathematical heart particle animation.
 *
 * Phases:
 *  1. 'float'   — particles drift randomly across a dark screen
 *  2. 'gather'  — every particle eases toward a target sampled from the
 *                  parametric heart curve x=16sin³t, y=13cost−5cos2t−…
 *                  with staggered delays + slight overshoot for organic feel
 *  3. 'formed'  — the heart holds shape and beats (double-thump pulse)
 *                  with a soft radial glow
 *  4. 'burst'   — particles explode outward and fade, clearing the stage
 *                  for the message reveal
 *
 * Reduced motion: particles snap to the formed heart with a gentle opacity
 * breathe — no gather flight, no burst.
 */

export type HeartPhase = 'float' | 'gather' | 'formed' | 'burst' | 'done'

interface HeartParticle {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
  size: number
  color: string
  alpha: number
  delay: number // seconds before this particle starts gathering
  progress: number // 0..1 gather progress
  jitterPhase: number
  // burst state
  bvx: number
  bvy: number
}

export interface HeartOptions {
  theme: ThemeConfig
  baseCount?: number
  /** Callback fired once when gathering completes */
  onFormed?: () => void
  /** Callback fired once when the burst finishes */
  onBurstDone?: () => void
}

const HEARTBEAT_BPM = 76

export class HeartAnimation extends AnimationEngine {
  private particles: HeartParticle[] = []
  private theme: ThemeConfig
  private baseCount: number
  private phase: HeartPhase = 'float'
  private phaseT = 0
  private heartScale = 1
  private formedFired = false
  private burstFired = false
  private onFormed?: () => void
  private onBurstDone?: () => void

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings, options: HeartOptions) {
    super(canvas, settings)
    this.theme = options.theme
    this.baseCount = options.baseCount ?? 170
    this.onFormed = options.onFormed
    this.onBurstDone = options.onBurstDone
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
  }

  setPhase(phase: HeartPhase): void {
    if (this.phase === phase) return
    this.phase = phase
    this.phaseT = 0
    if (phase === 'gather') {
      this.assignTargets()
      if (this.reducedMotion) {
        // Snap to formed instantly with soft breathe
        for (const p of this.particles) {
          p.x = p.tx
          p.y = p.ty
          p.progress = 1
        }
        this.phase = 'formed'
        this.fireFormed()
      }
    }
    if (phase === 'formed' && this.reducedMotion) this.fireFormed()
    if (phase === 'burst' && this.reducedMotion) {
      this.phase = 'done'
      this.clear()
      this.fireBurst()
    }
    if (phase === 'done') {
      this.clear()
    }
  }

  getPhase(): HeartPhase {
    return this.phase
  }

  private fireFormed(): void {
    if (!this.formedFired) {
      this.formedFired = true
      this.onFormed?.()
    }
  }

  private fireBurst(): void {
    if (!this.burstFired) {
      this.burstFired = true
      this.onBurstDone?.()
    }
  }

  protected onStart(): void {
    this.populate()
  }

  protected onResize(): void {
    this.populate()
    if (this.phase === 'formed' || this.phase === 'gather') this.assignTargets()
  }

  protected onTierChanged(): void {
    this.populate()
  }

  private populate(): void {
    if (this.w === 0 || this.h === 0) return
    const reduced = this.reducedMotion ? 0.5 : 1
    const count = Math.max(
      40,
      Math.round(this.baseCount * this.quality.particleScale * reduced),
    )
    const colors = this.theme.particleColors
    this.particles = Array.from({ length: count }, () => ({
      x: rand(0, this.w),
      y: rand(0, this.h),
      vx: rand(-14, 14),
      vy: rand(-14, 14),
      tx: this.w / 2,
      ty: this.h / 2,
      size: rand(1.4, 3.2),
      color: pick(colors),
      alpha: rand(0.45, 1),
      delay: 0,
      progress: 0,
      jitterPhase: rand(0, Math.PI * 2),
      bvx: 0,
      bvy: 0,
    }))
  }

  /** Sample targets along the heart curve, scaled/centered for the viewport. */
  private assignTargets(): void {
    if (this.particles.length === 0) this.populate()
    const cx = this.w / 2
    // Slightly above center on tall screens so text has room below.
    const cy = this.h * (this.h > this.w ? 0.42 : 0.46)
    const fit = Math.min(this.w, this.h) * 0.34
    const scale = fit / 17 // heart curve spans roughly x∈[-16,16], y∈[-5,17]
    // Visual centroid of the parametric heart (canvas space, y down).
    const centroidY = 2.4 * scale
    this.particles.forEach((p, i) => {
      // Golden-angle spread along the curve → even, non-repeating coverage.
      const curveT = (i * 2.399963229728653) % (Math.PI * 2)
      const c = heartCurvePoint(curveT)
      const outlineX = c.x * scale
      const outlineY = c.y * scale - centroidY
      const onOutline = i % 10 < 7
      let fx: number
      let fy: number
      if (onOutline) {
        fx = outlineX
        fy = outlineY
      } else {
        // Interior fill: shrink outline point toward the centroid — the heart
        // is star-shaped around it, so every sample stays inside the curve.
        const s = rand(0.12, 0.88)
        fx = outlineX * s
        fy = outlineY * s
      }
      p.tx = cx + fx + rand(-1.5, 1.5)
      p.ty = cy + fy + rand(-1.5, 1.5)
      p.delay = rand(0, 1.4)
      p.progress = 0
    })
  }

  /** Heartbeat envelope: two thumps per cycle (lub-dub). */
  private beat(t: number): number {
    const period = 60 / HEARTBEAT_BPM
    const phase = (t % period) / period
    const thump = (center: number, width: number, amp: number) =>
      amp * Math.exp(-Math.pow((phase - center) / width, 2))
    return thump(0.12, 0.055, 1) + thump(0.3, 0.07, 0.55)
  }

  protected update(dt: number, t: number): void {
    this.phaseT += dt
    switch (this.phase) {
      case 'float': {
        for (const p of this.particles) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          if (p.x < 0 || p.x > this.w) p.vx *= -1
          if (p.y < 0 || p.y > this.h) p.vy *= -1
        }
        break
      }
      case 'gather': {
        let allDone = true
        for (const p of this.particles) {
          if (this.phaseT < p.delay) {
            allDone = false
            // Gentle drift while waiting
            p.x += p.vx * dt * 0.35
            p.y += p.vy * dt * 0.35
            continue
          }
          const duration = 1.6
          p.progress = clamp(p.progress + dt / duration, 0, 1)
          if (p.progress < 1) allDone = false
          const eased = easeOutCubic(p.progress)
          // Slight arc: perpendicular offset that vanishes as it settles
          const arc = Math.sin(p.progress * Math.PI) * 18
          const px = p.x
          const py = p.y
          p.x = lerp(px, p.tx + arc * Math.cos(p.jitterPhase), eased * 0.22 + 0.78 * p.progress)
          p.y = lerp(py, p.ty + arc * Math.sin(p.jitterPhase), eased * 0.22 + 0.78 * p.progress)
        }
        if (allDone || this.phaseT > 4.5) {
          for (const p of this.particles) {
            p.x = p.tx
            p.y = p.ty
          }
          this.phase = 'formed'
          this.phaseT = 0
          this.fireFormed()
        }
        break
      }
      case 'formed': {
        this.heartScale = 1 + 0.05 * this.beat(t)
        const cx = this.w / 2
        const cy = this.h * (this.h > this.w ? 0.42 : 0.46)
        for (const p of this.particles) {
          // Breathing jitter around target
          const jx = Math.sin(t * 1.7 + p.jitterPhase) * 1.2
          const jy = Math.cos(t * 1.9 + p.jitterPhase) * 1.2
          p.x = cx + (p.tx - cx) * this.heartScale + jx
          p.y = cy + (p.ty - cy) * this.heartScale + jy
        }
        break
      }
      case 'burst': {
        const cx = this.w / 2
        const cy = this.h * (this.h > this.w ? 0.42 : 0.46)
        for (const p of this.particles) {
          if (p.bvx === 0 && p.bvy === 0) {
            const ang = Math.atan2(p.y - cy, p.x - cx) + rand(-0.35, 0.35)
            const force = rand(90, 320)
            p.bvx = Math.cos(ang) * force
            p.bvy = Math.sin(ang) * force
          }
          p.x += p.bvx * dt
          p.y += p.bvy * dt
          p.bvy += 30 * dt
          p.alpha = clamp(p.alpha - dt * 0.7, 0, 1)
        }
        if (this.phaseT > 1.6) {
          this.phase = 'done'
          this.fireBurst()
        }
        break
      }
      case 'done':
        break
    }
  }

  protected draw(t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.w, this.h)
    if (this.phase === 'done') return

    // Soft halo behind the formed heart
    if ((this.phase === 'formed' || this.phase === 'burst') && this.quality.fancy) {
      const cx = this.w / 2
      const cy = this.h * (this.h > this.w ? 0.42 : 0.46)
      const haloR = Math.min(this.w, this.h) * 0.5
      const halo = glowSprite(this.theme.glow.replace(/[\d.]+\)$/, '0.5)'), 256)
      const pulse = this.phase === 'formed' ? 1 + 0.06 * this.beat(t) : 1
      const s = haloR * 2 * pulse
      ctx.globalAlpha = this.phase === 'formed' ? 0.5 : clamp(0.5 - this.phaseT * 0.3, 0, 0.5)
      ctx.drawImage(halo, cx - s / 2, cy - s / 2, s, s)
      ctx.globalAlpha = 1
    }

    const sprite = this.quality.fancy ? glowSprite(this.theme.accent, 32) : null
    for (const p of this.particles) {
      if (p.alpha <= 0.01) continue
      ctx.globalAlpha = p.alpha
      if (sprite && p.size > 2.2) {
        const s = p.size * 5
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s)
      }
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }

    // Delicate heart outline once formed (premium touch, high tier only)
    if (this.phase === 'formed' && this.quality.fancy) {
      const cx = this.w / 2
      const cy = this.h * (this.h > this.w ? 0.42 : 0.46)
      const size = Math.min(this.w, this.h) * 0.34 * 1.02 * this.heartScale
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 2)
      ctx.strokeStyle = this.theme.accent
      ctx.lineWidth = 1.5
      heartPath(ctx, cx, cy - size * 0.28, size)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }
}
