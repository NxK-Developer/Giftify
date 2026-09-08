import type { ThemeConfig } from '@/types'
import { AnimationEngine, type EngineSettings } from './AnimationEngine'
import {
  rand,
  pick,
  lerp,
  clamp,
  glowSprite,
  colorWithAlpha,
  heartPath,
} from './canvasUtils'

/**
 * ParticleEngine — theme-aware ambient particle field.
 * One engine, seven visual personalities driven purely by ThemeConfig:
 * stars (galaxy), petals (blossom), hearts (heart), glyphs (matrix),
 * dust (sunset), confetti specks (celebration), orbs (minimal).
 *
 * Performance: sprite-based glows (no per-particle shadowBlur), depth-based
 * parallax, count scaled by tier/intensity, pauses with the tab.
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  depth: number // 0.35 (far) .. 1 (near)
  color: string
  alpha: number
  twinklePhase: number
  twinkleSpeed: number
  rotation: number
  rotationSpeed: number
  swayPhase: number
  glyph?: string
}

const GLYPHS = '01<>{}[]/\\|=+*#$%&@ABCXYZｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ'

export interface ParticleFieldOptions {
  theme: ThemeConfig
  /** Base count before tier scaling */
  baseCount?: number
  intensity?: number
}

export class ParticleEngine extends AnimationEngine {
  private particles: Particle[] = []
  private theme: ThemeConfig
  private baseCount: number
  private glyphFont = '12px ui-monospace, monospace'

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings, options: ParticleFieldOptions) {
    super(canvas, settings)
    this.theme = options.theme
    this.baseCount = options.baseCount ?? 120
    this.settings.intensity = options.intensity ?? 1
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
    this.populate()
  }

  setIntensity(intensity: number): void {
    this.settings.intensity = clamp(intensity, 0.2, 2)
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

  protected onReducedMotionChanged(): void {
    this.populate()
    if (this.reducedMotion) this.renderStatic()
  }

  private targetCount(): number {
    const intensity = this.settings.intensity ?? 1
    const reduced = this.reducedMotion ? 0.35 : 1
    return Math.max(12, Math.round(this.baseCount * this.quality.particleScale * intensity * reduced))
  }

  private populate(): void {
    if (this.w === 0 || this.h === 0) return
    const count = this.targetCount()
    const kind = this.theme.particleKind
    this.particles = Array.from({ length: count }, () => this.spawn(kind === 'stars' || kind === 'orbs' ? 'anywhere' : 'anywhere'))
  }

  private spawn(_where: 'anywhere'): Particle {
    const kind = this.theme.particleKind
    const depth = rand(0.35, 1)
    const base: Particle = {
      x: rand(0, this.w),
      y: rand(0, this.h),
      vx: 0,
      vy: 0,
      size: 1,
      depth,
      color: pick(this.theme.particleColors),
      alpha: rand(0.25, 0.9),
      twinklePhase: rand(0, Math.PI * 2),
      twinkleSpeed: rand(0.6, 2.4),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.8, 0.8),
      swayPhase: rand(0, Math.PI * 2),
    }
    switch (kind) {
      case 'stars':
        base.size = rand(0.6, 2.2) * depth
        base.vx = rand(-2, 2) * depth
        base.vy = rand(-1.5, 1.5) * depth
        break
      case 'petals':
        base.size = rand(4, 9) * lerp(0.6, 1, depth)
        base.vy = rand(12, 30) * depth
        base.vx = rand(-6, 6)
        break
      case 'hearts':
        base.size = rand(4, 10) * lerp(0.6, 1, depth)
        base.vy = rand(-24, -8) * depth
        break
      case 'glyphs':
        base.size = rand(9, 15) * depth
        base.vy = rand(40, 120) * depth
        base.glyph = pick(GLYPHS.split(''))
        break
      case 'dust':
        base.size = rand(1, 3) * depth
        base.vy = rand(-14, -3) * depth
        base.vx = rand(-4, 4)
        break
      case 'confetti':
        base.size = rand(3, 6) * lerp(0.6, 1, depth)
        base.vy = rand(18, 46) * depth
        base.vx = rand(-10, 10)
        break
      case 'orbs':
        base.size = rand(10, 34) * depth
        base.vx = rand(-4, 4) * depth
        base.vy = rand(-4, 4) * depth
        base.alpha = rand(0.06, 0.2)
        break
    }
    return base
  }

  protected update(dt: number, t: number): void {
    const kind = this.theme.particleKind
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rotation += p.rotationSpeed * dt

      if (kind === 'petals' || kind === 'confetti') {
        p.x += Math.sin(t * 1.4 + p.swayPhase) * 12 * dt
      }
      if (kind === 'hearts') {
        p.x += Math.sin(t * 1.1 + p.swayPhase) * 9 * dt
      }
      if (kind === 'glyphs' && Math.random() < dt * 2.5) {
        p.glyph = pick(GLYPHS.split(''))
      }

      // Wrap around edges with margin
      const m = 20
      if (p.y > this.h + m) {
        p.y = -m
        p.x = rand(0, this.w)
      } else if (p.y < -m && p.vy < 0) {
        p.y = this.h + m
        p.x = rand(0, this.w)
      }
      if (p.x > this.w + m) p.x = -m
      else if (p.x < -m) p.x = this.w + m
    }
  }

  protected draw(t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.w, this.h)
    const kind = this.theme.particleKind

    for (const p of this.particles) {
      const twinkle =
        kind === 'stars' || kind === 'orbs'
          ? 0.6 + 0.4 * Math.sin(t * p.twinkleSpeed + p.twinklePhase)
          : 1
      const alpha = p.alpha * twinkle
      if (alpha <= 0.01) continue

      switch (kind) {
        case 'stars':
        case 'dust': {
          const sprite = glowSprite(p.color, 24)
          const s = p.size * 6
          ctx.globalAlpha = alpha
          ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s)
          break
        }
        case 'orbs': {
          const sprite = glowSprite(p.color, 64)
          const s = p.size * 3
          ctx.globalAlpha = alpha
          ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s)
          break
        }
        case 'petals': {
          ctx.globalAlpha = alpha
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation + Math.sin(t + p.swayPhase) * 0.4)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
          break
        }
        case 'hearts': {
          ctx.globalAlpha = alpha
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(Math.sin(t * 0.8 + p.swayPhase) * 0.25)
          ctx.fillStyle = p.color
          heartPath(ctx, 0, 0, p.size)
          ctx.fill()
          ctx.restore()
          break
        }
        case 'glyphs': {
          ctx.globalAlpha = alpha * 0.8
          ctx.font = `${p.size}px ui-monospace, SFMono-Regular, Menlo, monospace`
          ctx.fillStyle = p.color
          ctx.fillText(p.glyph ?? '0', p.x, p.y)
          break
        }
        case 'confetti': {
          ctx.globalAlpha = alpha
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
          break
        }
      }
    }
    ctx.globalAlpha = 1
  }

  /** Paint a themed vignette glow at screen edges (subtle depth). */
  drawVignette(): void {
    const ctx = this.ctx
    if (!ctx) return
    const g = ctx.createRadialGradient(
      this.w / 2,
      this.h / 2,
      Math.min(this.w, this.h) * 0.35,
      this.w / 2,
      this.h / 2,
      Math.max(this.w, this.h) * 0.75,
    )
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, colorWithAlpha('#000000', 0.4))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, this.w, this.h)
  }

  getGlyphFont(): string {
    return this.glyphFont
  }
}
