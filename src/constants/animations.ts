import type { AnimationStyleConfig, AnimationStyleId } from '@/types'

/**
 * Animation styles are configuration consumed by the AnimationEngine and the
 * recipient experience stage machine — they shape the intro, the particle
 * gathering behavior and the final flourish.
 */
export const ANIMATION_STYLES: AnimationStyleConfig[] = [
  {
    id: 'code-intro',
    name: 'Cinematic Code Intro',
    description: 'Terminal boot sequence, scanlines and matrix glow before the reveal',
    emoji: '💻',
    intro: 'terminal',
    gather: 'heart',
    flourish: 'sparkles',
    showTerminal: true,
  },
  {
    id: 'heart-formation',
    name: 'Heart Formation',
    description: 'Floating particles gather into a beating heart, then burst into the message',
    emoji: '💗',
    intro: 'soft',
    gather: 'heart',
    flourish: 'hearts',
    showTerminal: false,
  },
  {
    id: 'petal-bloom',
    name: 'Petal Bloom',
    description: 'Flowers bloom across the screen as petals drift through soft light',
    emoji: '🌸',
    intro: 'soft',
    gather: 'ring',
    flourish: 'petals',
    showTerminal: false,
  },
  {
    id: 'digital-rain',
    name: 'Digital Rain',
    description: 'Full matrix rain with glyph particles decoding into your surprise',
    emoji: '🟩',
    intro: 'matrix',
    gather: 'scatter',
    flourish: 'glyphs',
    showTerminal: true,
  },
  {
    id: 'confetti-burst',
    name: 'Confetti Burst',
    description: 'An instant party — confetti cannons, sparkles and high energy',
    emoji: '🎉',
    intro: 'instant',
    gather: 'scatter',
    flourish: 'confetti',
    showTerminal: false,
  },
  {
    id: 'classic-reveal',
    name: 'Classic Reveal',
    description: 'Elegant fades and blur-to-focus — timeless and calm',
    emoji: '🕊️',
    intro: 'soft',
    gather: 'ring',
    flourish: 'sparkles',
    showTerminal: false,
  },
]

export const ANIMATION_MAP: Record<AnimationStyleId, AnimationStyleConfig> = Object.fromEntries(
  ANIMATION_STYLES.map((a) => [a.id, a]),
) as Record<AnimationStyleId, AnimationStyleConfig>

export const ANIMATION_IDS: AnimationStyleId[] = ANIMATION_STYLES.map((a) => a.id)

export function getAnimationStyle(
  id: AnimationStyleId | string | undefined | null,
): AnimationStyleConfig {
  return ANIMATION_MAP[(id ?? 'code-intro') as AnimationStyleId] ?? ANIMATION_MAP['code-intro']
}

/** Terminal lines used by the cinematic code intro (visual effect only). */
export const TERMINAL_LINES: string[] = [
  'initializing surprise...',
  'connecting...',
  'loading memories...',
  'compiling emotions...',
  'preparing something special...',
  'access granted',
]
