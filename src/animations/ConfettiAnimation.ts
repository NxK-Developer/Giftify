import type { ThemeConfig } from '@/types'
import { AnimationEngine, type EngineSettings } from './AnimationEngine'
import { rand, pick, clamp, sparklePath, glowSprite } from './canvasUtils'

/**
 * ConfettiAnimation — procedural confetti cannons + sparkles.
 * burst(x, y) fires a cannon; ambient mode keeps a gentle celebratory
 * drizzle. Pieces are rects/ribbons/circles with gravity, drag and flutter;
 * sparkles are four-point stars that flash and fade.
 */

interface Confetto {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'ribbon' | 'circle'
  alpha: number
  flutterPhase: number
}

interface Sparkle {
  x: number
  y: number
  size: number
  color: string
  life: number // 0..1 (1 = new)
  decay: number
  rotation: number
}

export interface ConfettiOptions {
  theme: ThemeConfig
  ambient?: boolean
}

export class ConfettiAnimation extends AnimationEngine {
  private confetti: Confetto[] = []
  private sparkles: Sparkle[] = []
  private theme: ThemeConfig
  private ambient: boolean
  private ambientTimer = 0

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings, options: ConfettiOptions) {
    super(canvas, settings)
    this.theme = options.theme
    this.ambient = options.ambient ?? false
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
  }

  /** Fire a confetti cannon from (x, y) aiming upward. */
  burst(x?: number, y?: number, count = 90, spreadAngle = Math.PI * 0.8): void {
    if (this.reducedMotion) count = Math.min(count, 24)
    const scaled = Math.round(count * clamp(this.quality.particleScale + 0.25, 0.4, 1.2))
    const bx = x ?? this.w / 2
    const by = y ?? this.h
    for (let i = 0; i < scaled; i++) {
      const angle = -Math.PI / 2 + rand(-spreadAngle / 2, spreadAngle / 2)
      const force = rand(this.h * 0.5, this.h * 1.15)
      this.confetti.push({
        x: bx + rand(-8, 8),
        y: by + rand(-6, 6),
        vx: Math.cos(angle) * force * rand(0.55, 1),
        vy: Math.sin(angle) * force,
        size: rand(4, 9),
        color: pick(this.theme.particleColors),
        rotation: rand(0, Math.PI * 2),
        rotationSpeed: rand(-6, 6),
        shape: pick(['rect', 'ribbon', 'circle'] as const),
        alpha: 1,
        flutterPhase: rand(0, Math.PI * 2),
      })
    }
    // Sparkle flash at the burst point
    const sparkCount = Math.round((this.quality.fancy ? 14 : 5) * this.quality.particleScale + 4)
    for (let i = 0; i < sparkCount; i++) {
      this.sparkles.push({
        x: bx + rand(-this.w * 0.08, this.w * 0.08),
        y: by + rand(-this.h * 0.1, 0),
        size: rand(3, 9),
        color: pick(['#ffffff', ...this.theme.particleColors]),
        life: 1,
        decay: rand(0.7, 1.6),
        rotation: rand(0, Math.PI),
      })
    }
    this.capArrays()
  }

  /** Dual side cannons — the classic celebration shot. */
  celebrate(count = 70): void {
    this.burst(this.w * 0.08, this.h * 0.98, count, Math.PI * 0.55)
    this.burst(this.w * 0.92, this.h * 0.98, count, Math.PI * 0.55)
  }

  private capArrays(): void {
    const maxConfetti = Math.round(320 * clamp(this.quality.particleScale + 0.3, 0.4, 1.2))
    if (this.confetti.length > maxConfetti) {
      this.confetti.splice(0, this.confetti.length - maxConfetti)
    }
    if (this.sparkles.length > 90) this.sparkles.splice(0, this.sparkles.length - 90)
  }

  protected update(dt: number, t: number): void {
    if (this.ambient) {
      this.ambientTimer -= dt
      if (this.ambientTimer <= 0) {
        this.ambientTimer = rand(0.25, 0.7)
        const drift = this.reducedMotion ? 1 : 3
        for (let i = 0; i < drift; i++) {
          this.confetti.push({
            x: rand(0, this.w),
            y: -12,
            vx: rand(-14, 14),
            vy: rand(30, 70),
            size: rand(3, 7),
            color: pick(this.theme.particleColors),
            rotation: rand(0, Math.PI * 2),
            rotationSpeed: rand(-4, 4),
            shape: pick(['rect', 'ribbon', 'circle'] as const),
            alpha: rand(0.5, 0.95),
            flutterPhase: rand(0, Math.PI * 2),
          })
        }
        this.capArrays()
      }
    }

    const gravity = this.h * 0.42
    for (const c of this.confetti) {
      c.vy += gravity * dt
      c.vx *= 1 - 0.6 * dt // drag
      c.vy *= 1 - 0.25 * dt
      c.x += (c.vx + Math.sin(t * 3 + c.flutterPhase) * 26) * dt
      c.y += c.vy * dt
      c.rotation += c.rotationSpeed * dt
      if (c.y > this.h + 20) c.alpha = 0
    }
    this.confetti = this.confetti.filter((c) => c.alpha > 0.01)

    for (const s of this.sparkles) {
      s.life -= s.decay * dt
      s.rotation += dt * 1.5
    }
    this.sparkles = this.sparkles.filter((s) => s.life > 0)
  }

  protected draw(): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.w, this.h)

    for (const c of this.confetti) {
      ctx.globalAlpha = clamp(c.alpha, 0, 1)
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.rotation)
      // Flutter: squash horizontally like a tumbling paper piece
      const squash = 0.45 + 0.55 * Math.abs(Math.sin(c.flutterPhase + c.rotation))
      ctx.scale(squash, 1)
      ctx.fillStyle = c.color
      if (c.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, c.size * 0.55, 0, Math.PI * 2)
        ctx.fill()
      } else if (c.shape === 'ribbon') {
        ctx.fillRect(-c.size * 0.22, -c.size, c.size * 0.44, c.size * 2)
      } else {
        ctx.fillRect(-c.size / 2, -c.size / 3.2, c.size, c.size / 1.6)
      }
      ctx.restore()
    }

    if (this.quality.fancy) {
      const sprite = glowSprite(this.theme.accent, 32)
      for (const s of this.sparkles) {
        const a = clamp(s.life, 0, 1)
        ctx.globalAlpha = a * 0.9
        ctx.fillStyle = s.color
        sparklePath(ctx, s.x, s.y, s.size * (0.6 + a * 0.8), s.rotation)
        ctx.fill()
        ctx.globalAlpha = a * 0.35
        ctx.drawImage(sprite, s.x - s.size * 2, s.y - s.size * 2, s.size * 4, s.size * 4)
      }
    } else {
      for (const s of this.sparkles) {
        ctx.globalAlpha = clamp(s.life, 0, 1) * 0.9
        ctx.fillStyle = s.color
        sparklePath(ctx, s.x, s.y, s.size, s.rotation)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  protected onCleanup(): void {
    this.confetti = []
    this.sparkles = []
  }
}
