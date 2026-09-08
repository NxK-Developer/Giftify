#!/usr/bin/env node
/**
 * generate-icons.mjs — zero-dependency brand asset generator.
 *
 * ₹0 budget rule: no image CDN, no ImageMagick, no sharp, no canvas package.
 * Everything is rasterised mathematically in pure Node (signed-distance fields
 * + a hand-rolled PNG encoder on top of zlib) so `npm run icons` works on any
 * machine with Node 18+ and nothing to install.
 *
 * Outputs (public/):
 *   icons/icon-192.png            PWA icon
 *   icons/icon-512.png            PWA icon (install splash)
 *   icons/icon-maskable-192.png   adaptive icon safe-zone variant
 *   icons/icon-maskable-512.png   adaptive icon safe-zone variant
 *   icons/apple-touch-icon.png    180×180, opaque
 *   icons/favicon-32.png          legacy favicon
 *   icons/og-image.png            1200×630 social share card
 *
 * Run: npm run icons
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ICON_DIR = join(ROOT, 'public', 'icons')

/* ------------------------------------------------------------------ */
/* PNG encoder                                                         */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

/** @param {Uint8ClampedArray} rgba */
function encodePng(width, height, rgba) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ */
/* Micro surface (float RGBA, alpha-composited)                        */
/* ------------------------------------------------------------------ */

class Surface {
  constructor(width, height) {
    this.w = width
    this.h = height
    this.data = new Float32Array(width * height * 4)
  }

  /** Source-over composite of a single sample. */
  over(x, y, r, g, b, a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    const d = this.data
    const out = a + d[i + 3] * (1 - a)
    if (out <= 0) return
    d[i] = (r * a + d[i] * d[i + 3] * (1 - a)) / out
    d[i + 1] = (g * a + d[i + 1] * d[i + 3] * (1 - a)) / out
    d[i + 2] = (b * a + d[i + 2] * d[i + 3] * (1 - a)) / out
    d[i + 3] = out
  }

  /** Additive light (glows) — never darkens, clamps at 1. */
  add(x, y, r, g, b, a) {
    if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    const d = this.data
    d[i] = Math.min(1, d[i] + r * a)
    d[i + 1] = Math.min(1, d[i + 1] + g * a)
    d[i + 2] = Math.min(1, d[i + 2] + b * a)
    d[i + 3] = Math.min(1, d[i + 3] + a * 0.3)
  }

  fill(r, g, b, a = 1) {
    for (let i = 0; i < this.data.length; i += 4) {
      this.data[i] = r
      this.data[i + 1] = g
      this.data[i + 2] = b
      this.data[i + 3] = a
    }
  }

  toUint8() {
    const out = new Uint8ClampedArray(this.w * this.h * 4)
    for (let i = 0; i < out.length; i++) out[i] = Math.round(Math.min(1, Math.max(0, this.data[i])) * 255)
    return out
  }
}

/** Paint a bounded region with a per-pixel callback. */
function paint(surf, x0, y0, x1, y1, fn) {
  const sx = Math.max(0, Math.floor(x0))
  const sy = Math.max(0, Math.floor(y0))
  const ex = Math.min(surf.w - 1, Math.ceil(x1))
  const ey = Math.min(surf.h - 1, Math.ceil(y1))
  for (let y = sy; y <= ey; y++) {
    for (let x = sx; x <= ex; x++) {
      fn(x, y)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Geometry + color helpers                                            */
/* ------------------------------------------------------------------ */

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smooth = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

/** stops: [[pos, '#hex'], ...] */
function ramp(stops, t) {
  const x = clamp01(t)
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i]
    const [p1, c1] = stops[i + 1]
    if (x >= p0 && x <= p1) {
      const k = p1 === p0 ? 0 : (x - p0) / (p1 - p0)
      const a = hexToRgb(c0)
      const b = hexToRgb(c1)
      return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
    }
  }
  return hexToRgb(stops[stops.length - 1][1])
}

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax
  const vy = by - ay
  const wx = px - ax
  const wy = py - ay
  const len2 = vx * vx + vy * vy
  const t = len2 === 0 ? 0 : clamp01((wx * vx + wy * vy) / len2)
  const dx = wx - vx * t
  const dy = wy - vy * t
  return Math.hypot(dx, dy)
}

function roundedRectSDF(px, py, cx, cy, hw, hh, r) {
  const dx = Math.abs(px - cx) - (hw - r)
  const dy = Math.abs(py - cy) - (hh - r)
  const ax = Math.max(dx, 0)
  const ay = Math.max(dy, 0)
  return Math.hypot(ax, ay) + Math.min(Math.max(dx, dy), 0) - r
}

/** Deterministic PRNG so generated assets are byte-stable across runs. */
function makeRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/* ------------------------------------------------------------------ */
/* Stroke font (uppercase + lowercase x) — segments in a 0..1 box      */
/* ------------------------------------------------------------------ */

const GLYPHS = {
  A: [[[0, 1], [0.5, 0]], [[0.5, 0], [1, 1]], [[0.19, 0.62], [0.81, 0.62]]],
  B: [
    [[0, 0], [0, 1]], [[0, 0], [0.68, 0]], [[0.68, 0], [0.92, 0.16]], [[0.92, 0.16], [0.92, 0.34]],
    [[0.92, 0.34], [0.68, 0.5]], [[0, 0.5], [0.68, 0.5]], [[0.68, 0.5], [0.96, 0.66]],
    [[0.96, 0.66], [0.96, 0.84]], [[0.96, 0.84], [0.7, 1]], [[0.7, 1], [0, 1]],
  ],
  C: [
    [[0.92, 0.16], [0.66, 0]], [[0.66, 0], [0.34, 0]], [[0.34, 0], [0.06, 0.28]],
    [[0.06, 0.28], [0.06, 0.72]], [[0.06, 0.72], [0.34, 1]], [[0.34, 1], [0.66, 1]], [[0.66, 1], [0.92, 0.84]],
  ],
  D: [
    [[0, 0], [0, 1]], [[0, 0], [0.6, 0]], [[0.6, 0], [0.94, 0.34]], [[0.94, 0.34], [0.94, 0.66]],
    [[0.94, 0.66], [0.6, 1]], [[0.6, 1], [0, 1]],
  ],
  E: [[[0.9, 0], [0, 0]], [[0, 0], [0, 1]], [[0, 1], [0.9, 1]], [[0, 0.5], [0.7, 0.5]]],
  F: [[[0.9, 0], [0, 0]], [[0, 0], [0, 1]], [[0, 0.5], [0.7, 0.5]]],
  G: [
    [[0.92, 0.16], [0.66, 0]], [[0.66, 0], [0.34, 0]], [[0.34, 0], [0.06, 0.28]],
    [[0.06, 0.28], [0.06, 0.72]], [[0.06, 0.72], [0.34, 1]], [[0.34, 1], [0.66, 1]],
    [[0.66, 1], [0.92, 0.82]], [[0.92, 0.82], [0.92, 0.56]], [[0.92, 0.56], [0.6, 0.56]],
  ],
  H: [[[0, 0], [0, 1]], [[1, 0], [1, 1]], [[0, 0.5], [1, 0.5]]],
  I: [[[0.16, 0], [0.84, 0]], [[0.5, 0], [0.5, 1]], [[0.16, 1], [0.84, 1]]],
  J: [[[0.78, 0], [0.78, 0.74]], [[0.78, 0.74], [0.54, 1]], [[0.54, 1], [0.24, 1]], [[0.24, 1], [0.06, 0.8]]],
  K: [[[0, 0], [0, 1]], [[0.96, 0], [0, 0.54]], [[0, 0.54], [0.96, 1]]],
  L: [[[0, 0], [0, 1]], [[0, 1], [0.9, 1]]],
  M: [[[0, 1], [0, 0]], [[0, 0], [0.5, 0.56]], [[0.5, 0.56], [1, 0]], [[1, 0], [1, 1]]],
  N: [[[0, 1], [0, 0]], [[0, 0], [1, 1]], [[1, 1], [1, 0]]],
  O: [
    [[0.3, 0], [0.7, 0]], [[0.7, 0], [0.96, 0.3]], [[0.96, 0.3], [0.96, 0.7]], [[0.96, 0.7], [0.7, 1]],
    [[0.7, 1], [0.3, 1]], [[0.3, 1], [0.04, 0.7]], [[0.04, 0.7], [0.04, 0.3]], [[0.04, 0.3], [0.3, 0]],
  ],
  P: [
    [[0, 1], [0, 0]], [[0, 0], [0.7, 0]], [[0.7, 0], [0.95, 0.2]], [[0.95, 0.2], [0.95, 0.34]],
    [[0.95, 0.34], [0.7, 0.55]], [[0.7, 0.55], [0, 0.55]],
  ],
  Q: [
    [[0.3, 0], [0.7, 0]], [[0.7, 0], [0.96, 0.3]], [[0.96, 0.3], [0.96, 0.7]], [[0.96, 0.7], [0.7, 1]],
    [[0.7, 1], [0.3, 1]], [[0.3, 1], [0.04, 0.7]], [[0.04, 0.7], [0.04, 0.3]], [[0.04, 0.3], [0.3, 0]],
    [[0.66, 0.68], [1.02, 1.04]],
  ],
  R: [
    [[0, 1], [0, 0]], [[0, 0], [0.7, 0]], [[0.7, 0], [0.95, 0.2]], [[0.95, 0.2], [0.95, 0.34]],
    [[0.95, 0.34], [0.7, 0.55]], [[0.7, 0.55], [0, 0.55]], [[0.55, 0.55], [0.98, 1]],
  ],
  S: [
    [[0.94, 0.18], [0.7, 0]], [[0.7, 0], [0.3, 0]], [[0.3, 0], [0.06, 0.2]], [[0.06, 0.2], [0.06, 0.34]],
    [[0.06, 0.34], [0.3, 0.5]], [[0.3, 0.5], [0.7, 0.5]], [[0.7, 0.5], [0.94, 0.66]],
    [[0.94, 0.66], [0.94, 0.8]], [[0.94, 0.8], [0.7, 1]], [[0.7, 1], [0.3, 1]], [[0.3, 1], [0.06, 0.82]],
  ],
  T: [[[0, 0], [1, 0]], [[0.5, 0], [0.5, 1]]],
  U: [[[0, 0], [0, 0.72]], [[0, 0.72], [0.26, 1]], [[0.26, 1], [0.74, 1]], [[0.74, 1], [1, 0.72]], [[1, 0.72], [1, 0]]],
  V: [[[0, 0], [0.5, 1]], [[0.5, 1], [1, 0]]],
  W: [[[0, 0], [0.26, 1]], [[0.26, 1], [0.5, 0.44]], [[0.5, 0.44], [0.74, 1]], [[0.74, 1], [1, 0]]],
  X: [[[0, 0], [1, 1]], [[1, 0], [0, 1]]],
  Y: [[[0, 0], [0.5, 0.52]], [[1, 0], [0.5, 0.52]], [[0.5, 0.52], [0.5, 1]]],
  Z: [[[0, 0], [1, 0]], [[1, 0], [0, 1]], [[0, 1], [1, 1]]],
  x: [[[0.22, 0.34], [0.78, 1]], [[0.78, 0.34], [0.22, 1]]],
  ' ': [],
}

const ADVANCE = { I: 0.72, J: 0.86, ' ': 0.52, x: 0.92, T: 1.0, default: 1.06 }

function measureText(text, height, tracking = 0.14) {
  let w = 0
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()]
    if (!glyph) continue
    const adv = ADVANCE[ch] ?? ADVANCE.default
    w += adv + tracking
  }
  return Math.max(0, w - tracking) * height
}

/**
 * Draw stroke text. `baselineY` is the TOP of the cap height.
 * @param {Surface} surf
 */
function drawText(
  surf,
  text,
  centerX,
  topY,
  height,
  { stroke = 0.13, tracking = 0.14, colorStops = null, glowColor = '#a855f7', glow = 0.55, alpha = 1 } = {},
) {
  const total = measureText(text, height, tracking)
  let cursorX = centerX - total / 2
  const radius = stroke * height
  const segments = []

  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()]
    if (!glyph) continue
    const adv = (ADVANCE[ch] ?? ADVANCE.default) * height
    for (const [[x0, y0], [x1, y1]] of glyph) {
      segments.push([cursorX + x0 * height, topY + y0 * height, cursorX + x1 * height, topY + y1 * height])
    }
    cursorX += adv + tracking * height
  }

  if (segments.length === 0) return

  const pad = radius * 7
  const x0 = centerX - total / 2 - pad
  const x1 = centerX + total / 2 + pad
  const y0 = topY - pad
  const y1 = topY + height + pad

  paint(surf, x0, y0, x1, y1, (px, py) => {
    let d = Infinity
    for (const [ax, ay, bx, by] of segments) {
      const dd = segDist(px + 0.5, py + 0.5, ax, ay, bx, by)
      if (dd < d) d = dd
    }
    const [x, y] = [px + 0.5, py + 0.5]

    // Outer glow (additive)
    if (glow > 0) {
      const g = Math.exp(-Math.pow(Math.max(0, d - radius) / (radius * 1.4), 2)) * glow
      if (g > 0.004) {
        const gc = hexToRgb(glowColor)
        surf.add(px, py, gc[0], gc[1], gc[2], g * alpha)
      }
    }

    // Stroke body
    const cov = clamp01(radius + 0.6 - d) * alpha
    if (cov > 0.004) {
      const t = colorStops ? clamp01((y - topY) / height) : 0
      const c = colorStops ? ramp(colorStops, t) : [1, 1, 1]
      // Slight horizontal sheen for a metallic feel
      const sheen = 0.97 + 0.03 * Math.sin(((x - centerX) / Math.max(1, total)) * Math.PI)
      surf.over(px, py, Math.min(1, c[0] * sheen), Math.min(1, c[1] * sheen), Math.min(1, c[2] * sheen), cov)
    }
  })
}

/* ------------------------------------------------------------------ */
/* Brand artwork                                                       */
/* ------------------------------------------------------------------ */

const BRAND_STOPS = [
  [0, '#2e1065'],
  [0.3, '#5b21b6'],
  [0.6, '#7c3aed'],
  [0.82, '#a21caf'],
  [1, '#be185d'],
]

const INK_STOPS = [
  [0, '#ffffff'],
  [0.55, '#fdf2ff'],
  [1, '#fbcfe8'],
]

/**
 * Rounded badge with the NxK monogram.
 * @param {Surface} surf
 */
function drawBadge(surf, { maskable = false, seed = 7 }) {
  const S = surf.w
  const cx = S / 2
  const cy = S / 2
  const radius = maskable ? 0 : S * 0.225
  const half = S / 2

  // 1. Background plate -------------------------------------------------
  const rand = makeRandom(seed)
  paint(surf, 0, 0, S - 1, S - 1, (px, py) => {
    const x = px + 0.5
    const y = py + 0.5
    const d = maskable ? -1 : roundedRectSDF(x, y, cx, cy, half, half, radius)
    const cov = clamp01(0.5 - d)
    if (cov <= 0) return

    const t = (x / S) * 0.62 + (y / S) * 0.38
    const base = ramp(BRAND_STOPS, t)

    // Depth: darken the corners, lighten the upper-left light source
    const nx = (x - cx) / half
    const ny = (y - cy) / half
    const vignette = 1 - 0.5 * clamp01(Math.hypot(nx, ny) - 0.25)
    const light = 1 + 0.1 * clamp01(1 - Math.hypot(nx + 0.55, ny + 0.65))

    // Central bloom behind the monogram
    const bloom = Math.exp(-Math.pow(Math.hypot(nx, ny) / 0.5, 2)) * 0.12
    const pink = hexToRgb('#f0abfc')

    surf.over(
      px,
      py,
      clamp01(base[0] * vignette * light + pink[0] * bloom),
      clamp01(base[1] * vignette * light + pink[1] * bloom),
      clamp01(base[2] * vignette * light + pink[2] * bloom),
      cov,
    )

    // Inner rim light: a thin band just inside the border, biased to the top
    const inside = -d
    const rim = maskable ? 0 : Math.exp(-Math.pow((inside - 9) / 13, 2))
    if (rim > 0.004) {
      const topLight = clamp01(0.75 - (ny + 1) * 0.42) * rim * 0.4
      surf.over(px, py, 1, 0.92, 1, topLight * cov)
    }
  })

  // 2. Star sparkles ----------------------------------------------------
  const sparkles = maskable ? 12 : 16
  for (let i = 0; i < sparkles; i++) {
    const sx = rand() * S
    const sy = rand() * S
    const sr = S * (0.004 + rand() * 0.008)
    const strength = 0.25 + rand() * 0.5
    const warm = rand() > 0.65
    const c = hexToRgb(warm ? '#fde68a' : '#ffffff')
    paint(surf, sx - sr * 6, sy - sr * 6, sx + sr * 6, sy + sr * 6, (px, py) => {
      const dx = px + 0.5 - sx
      const dy = py + 0.5 - sy
      const dist = Math.hypot(dx, dy)
      // 4-point star: soft core plus cross flare
      const flare =
        Math.exp(-Math.pow(Math.abs(dx) / (sr * 3.4), 2)) * Math.exp(-Math.pow(dy / (sr * 0.85), 2)) +
        Math.exp(-Math.pow(Math.abs(dy) / (sr * 3.4), 2)) * Math.exp(-Math.pow(dx / (sr * 0.85), 2))
      const core = Math.exp(-Math.pow(dist / (sr * 1.1), 2))
      const a = clamp01((core * 0.9 + flare * 0.55) * strength)
      if (a > 0.004) surf.add(px, py, c[0], c[1], c[2], a)
    })
  }

  // 3. Monogram ---------------------------------------------------------
  const text = 'NxK'
  // Maskable icons keep artwork inside the central 80% safe zone.
  const targetWidth = S * (maskable ? 0.52 : 0.58)
  const height = targetWidth / (measureText(text, 1) || 1)
  const capHeight = Math.min(height, S * (maskable ? 0.26 : 0.3))
  drawText(surf, text, cx, cy - capHeight / 2, capHeight, {
    stroke: 0.16,
    tracking: 0.1,
    colorStops: INK_STOPS,
    glowColor: '#f0abfc',
    glow: 0.24,
  })

  // 4. Bottom brand glow ------------------------------------------------
  const glowC = hexToRgb('#f472b6')
  paint(surf, 0, S * 0.55, S - 1, S - 1, (px, py) => {
    const x = px + 0.5
    const y = py + 0.5
    const d = maskable ? -1 : roundedRectSDF(x, y, cx, cy, half, half, radius)
    if (d > 0) return
    const k = smooth(S * 0.62, S, y) * 0.3
    if (k > 0.004) surf.add(px, py, glowC[0], glowC[1], glowC[2], k)
  })
}

/** Full-bleed social card: badge + headline + brand line. */
function drawOgImage(surf) {
  const W = surf.w
  const H = surf.h
  const rand = makeRandom(21)

  // Background ----------------------------------------------------------
  paint(surf, 0, 0, W - 1, H - 1, (px, py) => {
    const x = px + 0.5
    const y = py + 0.5
    const nx = (x - W / 2) / (W / 2)
    const ny = (y - H * 0.42) / (H * 0.75)
    const radial = clamp01(Math.hypot(nx * 0.92, ny) )
    const base = ramp(
      [
        [0, '#2a1550'],
        [0.42, '#150b2e'],
        [1, '#05030f'],
      ],
      radial,
    )
    // Diagonal brand wash from the top-left
    const wash = Math.exp(-Math.pow(Math.hypot((x - W * 0.18) / (W * 0.5), (y - H * 0.1) / (H * 0.6)), 2)) * 0.4
    const brand = ramp(BRAND_STOPS, (x / W) * 0.7 + (y / H) * 0.3)
    surf.over(
      px,
      py,
      clamp01(base[0] + brand[0] * wash),
      clamp01(base[1] + brand[1] * wash),
      clamp01(base[2] + brand[2] * wash),
      1,
    )
  })

  // Sparkles ------------------------------------------------------------
  for (let i = 0; i < 90; i++) {
    const sx = rand() * W
    const sy = rand() * H
    const sr = 1.2 + rand() * 3.2
    const strength = 0.15 + rand() * 0.5
    const c = hexToRgb(rand() > 0.7 ? '#fde68a' : rand() > 0.4 ? '#f0abfc' : '#ffffff')
    paint(surf, sx - sr * 6, sy - sr * 6, sx + sr * 6, sy + sr * 6, (px, py) => {
      const dist = Math.hypot(px + 0.5 - sx, py + 0.5 - sy)
      const a = Math.exp(-Math.pow(dist / (sr * 1.5), 2)) * strength
      if (a > 0.004) surf.add(px, py, c[0], c[1], c[2], a)
    })
  }

  // Badge ---------------------------------------------------------------
  const badge = 264
  const badgeSurf = new Surface(badge, badge)
  drawBadge(badgeSurf, { seed: 11 })
  const bx = Math.round(W / 2 - badge / 2)
  const by = 70
  const badgePx = badgeSurf.toUint8()
  for (let y = 0; y < badge; y++) {
    for (let x = 0; x < badge; x++) {
      const i = (y * badge + x) * 4
      surf.over(bx + x, by + y, badgePx[i] / 255, badgePx[i + 1] / 255, badgePx[i + 2] / 255, badgePx[i + 3] / 255)
    }
  }

  // Headline ------------------------------------------------------------
  const headline = 'NxK GREETINGS'
  const hSize = 68
  const hTop = by + badge + 46
  drawText(surf, headline, W / 2, hTop, hSize, {
    stroke: 0.115,
    tracking: 0.18,
    colorStops: [
      [0, '#ffffff'],
      [1, '#e9d5ff'],
    ],
    glowColor: '#a855f7',
    glow: 0.5,
  })

  const tagline = 'CINEMATIC PERSONALIZED GREETINGS'
  const tTop = hTop + hSize + 26
  drawText(surf, tagline, W / 2, tTop, 21, {
    stroke: 0.15,
    tracking: 0.26,
    colorStops: [
      [0, '#f0abfc'],
      [1, '#c4b5fd'],
    ],
    glowColor: '#ec4899',
    glow: 0.4,
  })

  // Brand rule ----------------------------------------------------------
  const rule = hexToRgb('#8b5cf6')
  const ruleY = tTop + 21 + 26
  paint(surf, W / 2 - 190, ruleY, W / 2 + 190, ruleY + 6, (px, py) => {
    const k = (px + 0.5 - (W / 2 - 190)) / 380
    const a = Math.sin(clamp01(k) * Math.PI) * 0.75
    const fade = clamp01(0.5 - Math.abs(py + 0.5 - (ruleY + 3)) / 1.4)
    if (a * fade > 0.004) surf.add(px, py, rule[0], rule[1], rule[2], a * fade)
  })

  drawText(surf, 'BY NXK DEVELOPER', W / 2, ruleY + 26, 19, {
    stroke: 0.16,
    tracking: 0.34,
    colorStops: [
      [0, '#a78bfa'],
      [1, '#7dd3fc'],
    ],
    glowColor: '#6d28d9',
    glow: 0.35,
  })
}

/* ------------------------------------------------------------------ */
/* Output helpers                                                      */
/* ------------------------------------------------------------------ */

/** Render at supersample then box-downsample for crisp small sizes. */
function renderBadge(size, { maskable = false, seed = 7, supersample = 1 }) {
  const S = size * supersample
  const surf = new Surface(S, S)
  drawBadge(surf, { maskable, seed })
  if (supersample === 1) return surf.toUint8()
  const out = new Uint8ClampedArray(size * size * 4)
  const n = supersample * supersample
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const i = ((y * supersample + sy) * S + (x * supersample + sx)) * 4
          r += surf.data[i]
          g += surf.data[i + 1]
          b += surf.data[i + 2]
          a += surf.data[i + 3]
        }
      }
      const o = (y * size + x) * 4
      out[o] = (r / n) * 255
      out[o + 1] = (g / n) * 255
      out[o + 2] = (b / n) * 255
      out[o + 3] = (a / n) * 255
    }
  }
  return out
}

function writePng(path, width, height, rgba) {
  writeFileSync(path, encodePng(width, height, rgba))
  console.log(`  ✓ ${path.replace(ROOT + '/', '')}  (${width}×${height})`)
}

mkdirSync(ICON_DIR, { recursive: true })

console.log('Generating NxK Greetings brand assets…')

const jobs = [
  { file: 'icon-192.png', size: 192, maskable: false, ss: 2 },
  { file: 'icon-512.png', size: 512, maskable: false, ss: 1 },
  { file: 'icon-maskable-192.png', size: 192, maskable: true, ss: 2 },
  { file: 'icon-maskable-512.png', size: 512, maskable: true, ss: 1 },
  { file: 'apple-touch-icon.png', size: 180, maskable: true, ss: 2 },
  { file: 'favicon-32.png', size: 32, maskable: false, ss: 8 },
]

for (const job of jobs) {
  writePng(join(ICON_DIR, job.file), job.size, job.size, renderBadge(job.size, { maskable: job.maskable, supersample: job.ss }))
}

const og = new Surface(1200, 630)
drawOgImage(og)
writePng(join(ICON_DIR, 'og-image.png'), 1200, 630, og.toUint8())


/* ------------------------------------------------------------------ */
/* SVG twin of the badge (crisp at any size, used as the favicon)      */
/* ------------------------------------------------------------------ */

function buildSvg(size = 512) {
  const S = size
  const cx = S / 2
  const cy = S / 2
  const rx = S * 0.225
  const text = 'NxK'
  const targetWidth = S * 0.58
  const height = Math.min(targetWidth / (measureText(text, 1) || 1), S * 0.3)
  const total = measureText(text, height, 0.1)
  const strokeW = 0.16 * height * 2
  const topY = cy - height / 2

  let cursorX = cx - total / 2
  const segs = []
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? GLYPHS[ch.toUpperCase()]
    if (!glyph) continue
    const adv = (ADVANCE[ch] ?? ADVANCE.default) * height
    for (const [[x0, y0], [x1, y1]] of glyph) {
      segs.push(
        `M${(cursorX + x0 * height).toFixed(1)} ${(topY + y0 * height).toFixed(1)}L${(cursorX + x1 * height).toFixed(1)} ${(topY + y1 * height).toFixed(1)}`,
      )
    }
    cursorX += adv + 0.1 * height
  }

  const rand = makeRandom(7)
  const sparkles = []
  for (let i = 0; i < 14; i++) {
    const x = (rand() * S).toFixed(1)
    const y = (rand() * S).toFixed(1)
    const r = (S * (0.004 + rand() * 0.007)).toFixed(2)
    const o = (0.35 + rand() * 0.55).toFixed(2)
    const fill = rand() > 0.65 ? '#fde68a' : '#ffffff'
    sparkles.push(`  <circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${o}"/>`)
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img" aria-label="NxK Greetings">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2e1065"/>
      <stop offset="0.3" stop-color="#5b21b6"/>
      <stop offset="0.6" stop-color="#7c3aed"/>
      <stop offset="0.82" stop-color="#a21caf"/>
      <stop offset="1" stop-color="#be185d"/>
    </linearGradient>
    <radialGradient id="bloom" cx="0.5" cy="0.48" r="0.62">
      <stop offset="0" stop-color="#f0abfc" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#f0abfc" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#fdf2ff"/>
      <stop offset="1" stop-color="#fbcfe8"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${(S * 0.02).toFixed(1)}" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${S}" height="${S}" rx="${rx.toFixed(1)}" fill="url(#bg)"/>
  <rect width="${S}" height="${S}" rx="${rx.toFixed(1)}" fill="url(#bloom)"/>
${sparkles.join('\n')}
  <path d="${segs.join('')}" fill="none" stroke="url(#ink)" stroke-width="${strokeW.toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" filter="url(#soft)"/>
</svg>
`
}

writeFileSync(join(ROOT, 'public', 'icon.svg'), buildSvg(512))
console.log('  ✓ public/icon.svg  (scalable)')

console.log('Done. Assets are static and committed — no runtime cost.')
