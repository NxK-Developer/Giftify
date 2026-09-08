import type { ThemeConfig, ThemeId } from '@/types'

/**
 * The reusable theme engine's data layer. Each theme defines its palette,
 * particle behavior and glow — consumed by ParticleEngine, stage components
 * and CSS previews alike. No theme-specific components exist.
 */
export const THEMES: ThemeConfig[] = [
  {
    id: 'galaxy',
    name: 'Galaxy',
    description: 'Stars, nebula gradients and drifting cosmic dust',
    emoji: '🌌',
    base: '#050310',
    background: ['#0b0620', '#1b1040', '#31195e'],
    particleColors: ['#e9e3ff', '#c4b5fd', '#8b5cf6', '#67e8f9', '#f0abfc'],
    accent: '#a78bfa',
    accent2: '#67e8f9',
    particleKind: 'stars',
    glow: 'rgba(139, 92, 246, 0.55)',
    fontTone: 'modern',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    description: 'Soft petals and blooming flowers in spring light',
    emoji: '🌸',
    base: '#12060f',
    background: ['#1c0a17', '#3d1230', '#5c1b41'],
    particleColors: ['#fbcfe8', '#f9a8d4', '#f472b6', '#fda4af', '#ffe4e6'],
    accent: '#f9a8d4',
    accent2: '#fda4af',
    particleKind: 'petals',
    glow: 'rgba(244, 114, 182, 0.5)',
    fontTone: 'script',
  },
  {
    id: 'heart',
    name: 'Heart',
    description: 'Floating hearts with a warm romantic glow',
    emoji: '💗',
    base: '#14040a',
    background: ['#22060f', '#4a0d22', '#6e1130'],
    particleColors: ['#fb7185', '#f43f5e', '#fda4af', '#ff8fab', '#fecdd3'],
    accent: '#fb7185',
    accent2: '#ff8fab',
    particleKind: 'hearts',
    glow: 'rgba(244, 63, 94, 0.55)',
    fontTone: 'script',
  },
  {
    id: 'matrix',
    name: 'Matrix',
    description: 'Digital rain, terminal greens and cyber depth',
    emoji: '🟩',
    base: '#020804',
    background: ['#020a05', '#04170c', '#062313'],
    particleColors: ['#4ade80', '#22c55e', '#86efac', '#bbf7d0', '#a3e635'],
    accent: '#4ade80',
    accent2: '#a3e635',
    particleKind: 'glyphs',
    glow: 'rgba(74, 222, 128, 0.5)',
    fontTone: 'mono',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm gradients with glowing ember particles',
    emoji: '🌇',
    base: '#140703',
    background: ['#2a0f05', '#5c2410', '#94401c'],
    particleColors: ['#fbbf24', '#fb923c', '#f97316', '#fcd34d', '#fda4af'],
    accent: '#fbbf24',
    accent2: '#fb923c',
    particleKind: 'dust',
    glow: 'rgba(251, 146, 60, 0.5)',
    fontTone: 'modern',
  },
  {
    id: 'celebration',
    name: 'Celebration',
    description: 'Confetti, sparkles and party energy',
    emoji: '🎉',
    base: '#0a0618',
    background: ['#160b2e', '#2a1152', '#431a75'],
    particleColors: ['#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb7185'],
    accent: '#fbbf24',
    accent2: '#f472b6',
    particleKind: 'confetti',
    glow: 'rgba(251, 191, 36, 0.5)',
    fontTone: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Elegant typography, deep calm and subtle motion',
    emoji: '🕊️',
    base: '#0a0a0f',
    background: ['#0c0c14', '#14141f', '#1c1c2b'],
    particleColors: ['#e4e4e7', '#a1a1aa', '#d4d4d8', '#c4b5fd', '#fbcfe8'],
    accent: '#d4d4d8',
    accent2: '#a1a1aa',
    particleKind: 'orbs',
    glow: 'rgba(228, 228, 231, 0.35)',
    fontTone: 'modern',
  },
]

export const THEME_MAP: Record<ThemeId, ThemeConfig> = Object.fromEntries(
  THEMES.map((t) => [t.id, t]),
) as Record<ThemeId, ThemeConfig>

export const THEME_IDS: ThemeId[] = THEMES.map((t) => t.id)

export function getTheme(id: ThemeId | string | undefined | null): ThemeConfig {
  return THEME_MAP[(id ?? 'galaxy') as ThemeId] ?? THEME_MAP.galaxy
}
