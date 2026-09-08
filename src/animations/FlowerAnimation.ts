import type { ThemeConfig } from '@/types'
import { AnimationEngine, type EngineSettings } from './AnimationEngine'
import {
  rand,
  pick,
  clamp,
  easeOutCubic,
  flowerPath,
  glowSprite,
  heartPath,
} from './canvasUtils'

/**
 * FlowerAnimation — procedural blooming flowers + drifting petals.
 * Flowers grow from anchor points (stems first, then petals unfurl with a
 * rotation ease), sway gently when in full bloom. Petals fall continuously
 * as an ambient layer. Fully procedural — zero image assets.
 */

interface Flower {
  x: number
  y: number
  size: number
  petals: number
  color: string
  centerColor: string
  stemHeight: number
  bloomStart: number // seconds before this flower starts blooming
  rotation: number
  swayPhase: number
}

interface FallingPetal {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  swayPhase: number
  alpha: number
}

export interface FlowerOptions {
  theme: ThemeConfig
  flowerCount?: number
  petalCount?: number
}

const BLOOM_DURATION = 1.4
const STEM_DURATION = 0.9

export class FlowerAnimation extends AnimationEngine {
  private flowers: Flower[] = []
  private petals: FallingPetal[] = []
  private theme: ThemeConfig
  private flowerCount: number
  private petalCount: number

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings, options: FlowerOptions) {
    super(canvas, settings)
    this.theme = options.theme
    this.flowerCount = options.flowerCount ?? 7
    this.petalCount = options.petalCount ?? 26
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
    this.populate()
  }

  protected onStart(): void {
    this.populate()
  }

  protected onResize(): void {
    this.populate()
  }

  protected onTierChanged(): void {
    this.populate()
  }

  private populate(): void {
    if (this.w === 0 || this.h === 0) return
    const scale = this.quality.particleScale
    const reduced = this.reducedMotion ? 0.4 : 1
    const colors = this.theme.particleColors

    const fCount = Math.max(3, Math.round(this.flowerCount * clamp(scale + 0.3, 0.5, 1) * reduced))
    this.flowers = Array.from({ length: fCount }, (_, i) => {
      const edge = i % 2 === 0
      return {
        x: edge ? rand(this.w * 0.02, this.w * 0.2) : rand(this.w * 0.8, this.w * 0.98),
        y: this.h - rand(4, this.h * 0.22),
        size: rand(16, 34),
        petals: Math.round(rand(5, 8)),
        color: pick(colors),
        centerColor: pick(['#fde68a', '#fbcfe8', '#fff7ed']),
        stemHeight: rand(30, 90),
        bloomStart: i * 0.28 + rand(0, 0.15),
        rotation: rand(-0.3, 0.3),
        swayPhase: rand(0, Math.PI * 2),
      }
    })

    const pCount = Math.max(8, Math.round(this.petalCount * scale * (this.reducedMotion ? 0.3 : 1)))
    this.petals = Array.from({ length: pCount }, () => ({
      x: rand(0, this.w),
      y: rand(-this.h, this.h),
      vx: rand(-8, 8),
      vy: rand(14, 40),
      size: rand(3.5, 8),
      color: pick(colors),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-1.4, 1.4),
      swayPhase: rand(0, Math.PI * 2),
      alpha: rand(0.35, 0.9),
    }))
  }

  protected update(dt: number, t: number): void {
    for (const p of this.petals) {
      p.x += (p.vx + Math.sin(t * 1.3 + p.swayPhase) * 14) * dt
      p.y += p.vy * dt
      p.rotation += p.rotationSpeed * dt
      if (p.y > this.h + 12) {
        p.y = rand(-40, -8)
        p.x = rand(0, this.w)
      }
      if (p.x < -12) p.x = this.w + 8
      else if (p.x > this.w + 12) p.x = -8
    }
  }

  protected draw(t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.w, this.h)

    // Flowers (behind petals)
    for (const f of this.flowers) {
      const local = t - f.bloomStart
      if (local < 0) continue
      const stemP = clamp(local / STEM_DURATION, 0, 1)
      const bloomP = clamp((local - STEM_DURATION) / BLOOM_DURATION, 0, 1)
      const stemH = f.stemHeight * easeOutCubic(stemP)
      const sway = this.reducedMotion ? 0 : Math.sin(t * 0.9 + f.swayPhase) * 0.05

      // Stem
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(f.x, this.h + 4)
      ctx.quadraticCurveTo(f.x + sway * 40, this.h - stemH * 0.6, f.x + sway * 24, f.y + (f.stemHeight - stemH))
      ctx.stroke()

      if (bloomP <= 0) continue
      const eased = easeOutCubic(bloomP)
      const headY = f.y + (f.stemHeight - stemH)
      const headX = f.x + sway * 24
      const size = f.size * eased

      if (this.quality.fancy) {
        const glow = glowSprite(f.color, 64)
        ctx.globalAlpha = 0.35 * eased
        ctx.drawImage(glow, headX - size * 1.6, headY - size * 1.6, size * 3.2, size * 3.2)
        ctx.globalAlpha = 1
      }

      ctx.save()
      ctx.translate(headX, headY)
      ctx.rotate(f.rotation + sway)
      ctx.fillStyle = f.color
      ctx.globalAlpha = 0.92
      flowerPath(ctx, 0, 0, size, f.petals, sway * 2)
      ctx.fill()
      // Inner petal highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      flowerPath(ctx, 0, 0, size * 0.55, f.petals, sway * 2 + 0.3)
      ctx.fill()
      // Center
      ctx.globalAlpha = eased
      ctx.fillStyle = f.centerColor
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.24, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.globalAlpha = 1
    }

    // Falling petals
    for (const p of this.petals) {
      ctx.globalAlpha = p.alpha
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation + Math.sin(t + p.swayPhase) * 0.4)
      ctx.fillStyle = p.color
      ctx.beginPath()
      // petal = teardrop via two quadratics
      ctx.moveTo(0, -p.size)
      ctx.quadraticCurveTo(p.size * 0.7, 0, 0, p.size)
      ctx.quadraticCurveTo(-p.size * 0.7, 0, 0, -p.size)
      ctx.fill()
      ctx.restore()
    }
    ctx.globalAlpha = 1
  }

  /** One-shot: a heart of petals rises from center (flourish accent). */
  drawCenterHeart(alpha: number): void {
    const ctx = this.ctx
    if (!ctx || alpha <= 0) return
    ctx.globalAlpha = clamp(alpha, 0, 1)
    ctx.fillStyle = this.theme.accent
    const size = Math.min(this.w, this.h) * 0.1
    heartPath(ctx, this.w / 2, this.h / 2, size)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  protected onCleanup(): void {
    this.flowers = []
    this.petals = []
  }
}
