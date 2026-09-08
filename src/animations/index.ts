/**
 * Animation engine barrel — single import point for the canvas layer.
 *
 * Everything here is framework-free: each engine owns its canvas, its rAF loop
 * and its lifecycle (mount → start → pause/resume → destroy), and every engine
 * auto-pauses when the tab is hidden. React wrappers live in
 * `src/components/animations/` and `src/components/background/`.
 *
 * Note: pages import engines directly (`@/animations/HeartAnimation`) so Vite
 * keeps the heavy canvas code out of chunks that never animate. This barrel is
 * the documented public surface of the layer, not a bundling hint.
 */

/* Engines ---------------------------------------------------------------- */

export { AnimationEngine } from './AnimationEngine'
export type { EngineSettings } from './AnimationEngine'

export { ParticleEngine } from './ParticleEngine'
export type { ParticleFieldOptions } from './ParticleEngine'

export { MatrixEngine } from './MatrixEngine'
export type { MatrixOptions } from './MatrixEngine'

export { HeartAnimation } from './HeartAnimation'
export type { HeartPhase, HeartOptions } from './HeartAnimation'

export { FlowerAnimation } from './FlowerAnimation'
export type { FlowerOptions } from './FlowerAnimation'

export { ConfettiAnimation } from './ConfettiAnimation'
export type { ConfettiOptions } from './ConfettiAnimation'

/* Non-canvas controllers ------------------------------------------------- */

export { CodeReveal } from './CodeReveal'
export type { CodeLine, CodeRevealState, CodeRevealOptions } from './CodeReveal'

export { Typewriter } from './Typewriter'
export type { TypewriterOptions } from './Typewriter'

/* Performance ------------------------------------------------------------- */

export { QUALITY, detectPerfTier, tierFromFps, FpsProbe } from './perf'
export type { QualityProfile } from './perf'

/* Canvas helpers ---------------------------------------------------------- */

export {
  rand,
  randInt,
  pick,
  lerp,
  clamp,
  easeOutCubic,
  easeInOutSine,
  fitCanvas,
  glowSprite,
  colorWithAlpha,
  heartPath,
  heartCurvePoint,
  flowerPath,
  sparklePath,
} from './canvasUtils'
