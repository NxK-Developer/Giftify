/** Shared canvas math & drawing helpers used by every animation engine. */

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

/**
 * Size a canvas to its parent with a capped devicePixelRatio.
 * Returns logical (CSS pixel) width/height. Mutates canvas.width/height.
 */
export function fitCanvas(
  canvas: HTMLCanvasElement,
  dprCap: number,
): { w: number; h: number; dpr: number } {
  const parent = canvas.parentElement
  const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect()
  const w = Math.max(1, Math.floor(rect.width))
  const h = Math.max(1, Math.floor(rect.height))
  const dpr = clamp(window.devicePixelRatio || 1, 1, dprCap)
  const pixelW = Math.floor(w * dpr)
  const pixelH = Math.floor(h * dpr)
  if (canvas.width !== pixelW || canvas.height !== pixelH) {
    canvas.width = pixelW
    canvas.height = pixelH
  }
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { w, h, dpr }
}

/** Pre-rendered radial glow sprite — cheap alternative to per-particle shadowBlur. */
const spriteCache = new Map<string, HTMLCanvasElement>()

export function glowSprite(color: string, size = 32): HTMLCanvasElement {
  const key = `${color}|${size}`
  const cached = spriteCache.get(key)
  if (cached) return cached
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d')
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, color)
    g.addColorStop(0.35, colorWithAlpha(color, 0.55))
    g.addColorStop(1, colorWithAlpha(color, 0))
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
  }
  spriteCache.set(key, c)
  return c
}

/** Convert '#rrggbb' (+ optional alpha override) to rgba() string. */
export function colorWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Draw a heart centered at (x, y) with the given pixel size. */
export function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size / 16
  ctx.beginPath()
  ctx.moveTo(x, y + 5 * s)
  ctx.bezierCurveTo(x, y + 2 * s, x - 5 * s, y - 4 * s, x - 9 * s, y - 4 * s)
  ctx.bezierCurveTo(x - 15 * s, y - 4 * s, x - 15 * s, y + 3 * s, x - 15 * s, y + 3 * s)
  ctx.bezierCurveTo(x - 15 * s, y + 8 * s, x - 9 * s, y + 12.5 * s, x, y + 16 * s)
  ctx.bezierCurveTo(x + 9 * s, y + 12.5 * s, x + 15 * s, y + 8 * s, x + 15 * s, y + 3 * s)
  ctx.bezierCurveTo(x + 15 * s, y + 3 * s, x + 15 * s, y - 4 * s, x + 9 * s, y - 4 * s)
  ctx.bezierCurveTo(x + 6 * s, y - 4 * s, x, y + 2 * s, x, y + 5 * s)
  ctx.closePath()
}

/** Classic mathematical heart curve: x=16sin³t, y=13cost−5cos2t−2cos3t−cos4t */
export function heartCurvePoint(t: number): { x: number; y: number } {
  const sinT = Math.sin(t)
  return {
    x: 16 * sinT * sinT * sinT,
    y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
  }
}

/** Draw a flower petal ring (used by FlowerAnimation). */
export function flowerPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petals: number,
  rotation: number,
): void {
  ctx.beginPath()
  const petalLen = radius
  const petalWidth = radius * 0.52
  for (let i = 0; i < petals; i++) {
    const angle = rotation + (i / petals) * Math.PI * 2
    const tipX = x + Math.cos(angle) * petalLen
    const tipY = y + Math.sin(angle) * petalLen
    const nx = Math.cos(angle + Math.PI / 2)
    const ny = Math.sin(angle + Math.PI / 2)
    const c1x = x + Math.cos(angle) * petalLen * 0.55 + nx * petalWidth
    const c1y = y + Math.sin(angle) * petalLen * 0.55 + ny * petalWidth
    const c2x = x + Math.cos(angle) * petalLen * 0.55 - nx * petalWidth
    const c2y = y + Math.sin(angle) * petalLen * 0.55 - ny * petalWidth
    if (i === 0) ctx.moveTo(x, y)
    ctx.quadraticCurveTo(c1x, c1y, tipX, tipY)
    ctx.quadraticCurveTo(c2x, c2y, x, y)
  }
  ctx.closePath()
}

/** Four-point sparkle star. */
export function sparklePath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation = 0,
): void {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = rotation + (i / 8) * Math.PI * 2
    const rad = i % 2 === 0 ? r : r * 0.32
    const px = x + Math.cos(angle) * rad
    const py = y + Math.sin(angle) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}
