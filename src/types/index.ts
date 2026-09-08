/**
 * Core domain types for the NxK Greetings platform.
 * Strongly typed end-to-end: Firestore documents, wizard state, configs.
 */

/* ------------------------------------------------------------------ */
/* Identifiers                                                         */
/* ------------------------------------------------------------------ */

export type OccasionId =
  | 'birthday'
  | 'love'
  | 'friendship'
  | 'congratulations'
  | 'anniversary'
  | 'thankyou'
  | 'sorry'
  | 'good-morning'
  | 'good-night'
  | 'special'
  | 'festival'
  | 'custom'

export type ThemeId =
  | 'galaxy'
  | 'blossom'
  | 'heart'
  | 'matrix'
  | 'sunset'
  | 'celebration'
  | 'minimal'

export type AnimationStyleId =
  | 'code-intro'
  | 'heart-formation'
  | 'petal-bloom'
  | 'digital-rain'
  | 'confetti-burst'
  | 'classic-reveal'

export type MusicTrackId = 'dreamy' | 'romantic' | 'calm' | 'celebration' | 'emotional' | 'none'

export type PrivacyMode = 'public' | 'unlisted' | 'private'

export type GreetingStatus = 'active' | 'disabled'

export type PerfTier = 'high' | 'medium' | 'low'

export type UserRole = 'user' | 'admin'

/* ------------------------------------------------------------------ */
/* Configuration entities (config-driven architecture)                 */
/* ------------------------------------------------------------------ */

export interface Occasion {
  id: OccasionId
  name: string
  emoji: string
  tagline: string
  /** CSS gradient used for the occasion card glow */
  gradient: [string, string]
  accent: string
  /** Suggested messages shown as chips on the personalize step */
  suggestions: string[]
}

/**
 * Reusable template definition. Templates are pure configuration —
 * no per-template pages are hardcoded anywhere in the app.
 */
export interface TemplateConfig {
  id: string
  name: string
  description: string
  occasion: OccasionId
  theme: ThemeId
  animation: AnimationStyleId
  music: MusicTrackId
  accentEmoji: string
  defaultText: {
    headline: string
    message: string
  }
  /** Render the message in a script/handwriting font */
  scriptStyle?: boolean
  featured?: boolean
}

export type ParticleKind = 'stars' | 'petals' | 'hearts' | 'glyphs' | 'dust' | 'confetti' | 'orbs'

export interface ThemeConfig {
  id: ThemeId
  name: string
  description: string
  emoji: string
  /** Deep background base color (hex) */
  base: string
  /** Gradient stops painted behind the particle canvas */
  background: [string, string, string]
  /** Particle palette */
  particleColors: string[]
  /** Primary neon accent */
  accent: string
  /** Secondary accent */
  accent2: string
  particleKind: ParticleKind
  /** Soft glow color (rgba) used for shadows and halos */
  glow: string
  /** Suggested font treatment for the message */
  fontTone: 'modern' | 'script' | 'mono'
}

export interface AnimationStyleConfig {
  id: AnimationStyleId
  name: string
  description: string
  emoji: string
  /** How the cinematic intro is staged */
  intro: 'terminal' | 'soft' | 'matrix' | 'instant'
  /** Shape floating particles gather into before the reveal */
  gather: 'heart' | 'ring' | 'scatter'
  /** The "special animation" flourish after the message */
  flourish: 'hearts' | 'petals' | 'confetti' | 'glyphs' | 'sparkles'
  /** Show the terminal code intro lines */
  showTerminal: boolean
}

export interface MusicTrackConfig {
  id: MusicTrackId
  name: string
  description: string
  emoji: string
  /** BPM of the generative composition (ignored for 'none') */
  tempo: number
  /** Chord progression: semitone root (0 = C) + chord quality */
  progression: { root: number; quality: 'maj' | 'min' | 'maj7' | 'min7' | 'sus2' }[]
  /** Synth character */
  timbre: {
    padWave: OscillatorType
    leadWave: OscillatorType
    cutoffHz: number
    reverbMix: number
    leadOctave: number
    density: number // notes per beat probability 0..1
  }
}

/* ------------------------------------------------------------------ */
/* Greetings                                                           */
/* ------------------------------------------------------------------ */

/** The creator-authored payload of a greeting (all sanitized strings). */
export interface GreetingConfig {
  occasion: OccasionId
  templateId: string
  recipientName: string
  senderName: string
  nickname: string
  relationship: string
  specialDate: string
  message: string
  theme: ThemeId
  animation: AnimationStyleId
  music: MusicTrackId
}

/** A stored greeting document (Firestore `greetings/{id}` or local demo store). */
export interface Greeting extends GreetingConfig {
  id: string
  ownerId: string
  privacy: PrivacyMode
  status: GreetingStatus
  views: number
  shares: number
  /** ISO strings at the app layer; Firestore Timestamps in the database */
  scheduledAt: string | null
  expiresAt: string | null
  /** PBKDF2 hash + salt (WebCrypto). Never a plaintext password. */
  passwordHash: string | null
  passwordSalt: string | null
  createdAt: string
  updatedAt: string | null
  /** True only for on-device demo greetings — never persisted to Firestore */
  isDemo?: boolean
}

export type GreetingFetchState =
  | 'ok'
  | 'password-required'
  | 'not-found'
  | 'disabled'
  | 'scheduled'
  | 'expired'
  | 'error'

export interface GreetingFetchResult {
  state: GreetingFetchState
  greeting?: Greeting
  /** When state === 'scheduled' */
  scheduledAt?: string | null
  /** When state === 'error' */
  error?: string
}

export interface CreateGreetingInput extends GreetingConfig {
  privacy: PrivacyMode
  scheduledAt: Date | null
  expiresAt: Date | null
  password: string | null
}

export interface CreateGreetingResult {
  id: string
  url: string
  isDemo: boolean
}

/* ------------------------------------------------------------------ */
/* Users / auth                                                        */
/* ------------------------------------------------------------------ */

export interface UserProfile {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  createdAt: string
  greetingCount: number
}

export interface SessionUser {
  uid: string
  email: string | null
  displayName: string | null
  isAnonymous: boolean
  /** True in Demo Mode (no Firebase): a local, clearly-labeled identity */
  isLocalDemo: boolean
}

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out'

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'abuse' | 'other'

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

export interface Report {
  id: string
  greetingId: string
  reason: ReportReason
  details: string
  /** Null for anonymous reporters — never exposed publicly */
  reporterUid: string | null
  status: ReportStatus
  createdAt: string
}

/* ------------------------------------------------------------------ */
/* Creator wizard                                                      */
/* ------------------------------------------------------------------ */

export interface WizardState {
  occasion: OccasionId | null
  templateId: string | null
  recipientName: string
  senderName: string
  nickname: string
  relationship: string
  specialDate: string
  message: string
  theme: ThemeId | null
  animation: AnimationStyleId | null
  music: MusicTrackId
  privacy: PrivacyMode
  /** ISO datetime strings from the local picker */
  scheduledAt: string | null
  expiresAt: string | null
  /** In-memory only — intentionally never persisted to localStorage */
  password: string
}

export type WizardStepId =
  | 'occasion'
  | 'template'
  | 'personalize'
  | 'theme'
  | 'animation'
  | 'music'
  | 'preview'
  | 'generate'
  | 'share'

/* ------------------------------------------------------------------ */
/* Toasts / UI                                                         */
/* ------------------------------------------------------------------ */

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  kind: ToastKind
  title: string
  message?: string
  durationMs?: number
}

/* ------------------------------------------------------------------ */
/* Recipient experience                                                */
/* ------------------------------------------------------------------ */

export type ExperienceStage =
  | 'opening'
  | 'intro'
  | 'particles'
  | 'heart'
  | 'name'
  | 'message'
  | 'flourish'
  | 'final'
