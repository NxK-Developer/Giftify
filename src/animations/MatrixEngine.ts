import type { ThemeConfig } from '@/types'
import { AnimationEngine, type EngineSettings } from './AnimationEngine'
import { rand, pick, clamp } from './canvasUtils'

/**
 * MatrixEngine — digital rain.
 * Column-based glyph streams with bright leader characters and fading
 * trails, tinted by the active theme (green for matrix, violet for galaxy
 * code-intro, etc). Trail fade uses a translucent fill instead of clearRect
 * for the classic phosphor-decay look.
 */

const RAIN_GLYPHS =
  '01ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ<>{}[]$#@%&*+=/\\|~'

interface Column {
  x: number
  y: number // head position (px)
  speed: number // px per second
  length: number // trail length in glyphs
  fontSize: number
  nextSwitch: number // time until glyph shuffle
}

export interface MatrixOptions {
  theme: ThemeConfig
  density?: number // 0.5..1.5 column density multiplier
  speed?: number // global speed multiplier
}

export class MatrixEngine extends AnimationEngine {
  private columns: Column[] = []
  private theme: ThemeConfig
  private density: number
  private speedMul: number

  constructor(canvas: HTMLCanvasElement, settings: EngineSettings, options: MatrixOptions) {
    super(canvas, settings)
    this.theme = options.theme
    this.density = options.density ?? 1
    this.speedMul = options.speed ?? 1
  }

  setTheme(theme: ThemeConfig): void {
    this.theme = theme
    this.buildColumns()
    this.clearTrails()
  }

  protected onStart(): void {
    this.buildColumns()
  }

  protected onResize(): void {
    this.buildColumns()
    this.clearTrails()
  }

  protected onTierChanged(): void {
    this.buildColumns()
  }

  private clearTrails(): void {
    const ctx = this.ctx
    if (ctx) ctx.clearRect(0, 0, this.w, this.h)
  }

  private buildColumns(): void {
    if (this.w === 0) return
    const fontSize = this.settings.tier === 'low' ? 16 : this.settings.tier === 'medium' ? 14 : 13
    const gap = fontSize * 1.25
    const reduced = this.reducedMotion ? 0.45 : 1
    const count = Math.max(6, Math.floor((this.w / gap) * this.density * this.quality.particleScale * reduced + 4))
    this.columns = Array.from({ length: count }, (_, i) => ({
      x: i * (this.w / count) + rand(-4, 4),
      y: rand(-this.h, 0),
      speed: rand(60, 190) * this.speedMul,
      length: Math.round(rand(6, 20)),
      fontSize,
      nextSwitch: rand(0.05, 0.4),
    }))
  }

  protected update(dt: number, _t: number): void {
    for (const col of this.columns) {
      col.y += col.speed * dt
      col.nextSwitch -= dt
      if (col.nextSwitch <= 0) col.nextSwitch = rand(0.08, 0.5)
      if (col.y - col.length * col.fontSize > this.h) {
        col.y = rand(-this.h * 0.5, -20)
        col.speed = rand(60, 190) * this.speedMul
        col.length = Math.round(rand(6, 20))
      }
    }
  }

  protected draw(): void {
    const ctx = this.ctx
    if (!ctx) return
    // Fade previous frame (trail decay)
    ctx.fillStyle = 'rgba(2, 6, 4, 0.14)'
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillRect(0, 0, this.w, this.h)

    const colors = this.theme.particleColors
    const leader = colors[0] ?? '#4ade80'
    const body = colors[1] ?? '#22c55e'

    for (const col of this.columns) {
      ctx.font = `${col.fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`
      const glyphsToDraw = this.quality.fancy ? col.length : Math.min(col.length, 8)
      for (let i = 0; i < glyphsToDraw; i++) {
        const y = col.y - i * col.fontSize
        if (y < -col.fontSize || y > this.h + col.fontSize) continue
        const fade = 1 - i / glyphsToDraw
        if (i === 0) {
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = clamp(fade * 0.95, 0, 1)
        } else {
          ctx.fillStyle = i < 3 ? leader : body
          ctx.globalAlpha = clamp(fade * 0.75, 0, 1)
        }
        const glyph = pick(RAIN_GLYPHS.split(''))
        ctx.fillText(glyph, col.x, y)
      }
    }
    ctx.globalAlpha = 1
  }

  /** Instant full clear (used on stage transitions). */
  clear(): void {
    this.clearTrails()
  }
}
