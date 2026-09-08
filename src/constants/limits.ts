/** Field limits, rate limits and storage keys — single source of truth. */

export const LIMITS = {
  recipientName: { min: 1, max: 40 },
  senderName: { min: 0, max: 40 },
  nickname: { min: 0, max: 24 },
  relationship: { min: 0, max: 30 },
  message: { min: 1, max: 1000 },
  password: { min: 6, max: 64 },
  reportDetails: { min: 0, max: 400 },
  displayName: { min: 0, max: 60 },
} as const

/** Greeting IDs: 7-char base62, e.g. /g/Ab7Kx92 */
export const GREETING_ID_LENGTH = 7
export const GREETING_ID_PATTERN = /^[A-Za-z0-9]{4,16}$/

/** Client-side abuse protection (documented limitation: no serverless tier on ₹0). */
export const RATE_LIMITS = {
  /** Minimum milliseconds between two generations from the same browser */
  minGenerateIntervalMs: 5_000,
  /** Maximum generations per rolling 24h from the same browser */
  maxGenerationsPerDay: 25,
  /** Minimum milliseconds between two reports from the same browser */
  minReportIntervalMs: 20_000,
  /** Maximum password attempts per greeting per session */
  maxPasswordAttempts: 8,
} as const

export const STORAGE_KEYS = {
  draft: 'nxxk.draft.v1',
  draftRestoredFlag: 'nxxk.draft.restored.v1',
  demoGreetings: 'nxxk.demo.greetings.v1',
  demoIdentity: 'nxxk.demo.identity.v1',
  settings: 'nxxk.settings.v1',
  stats: 'nxxk.creator.stats.v1',
  lastGenerateAt: 'nxxk.rate.lastGenerate.v1',
  generateCounts: 'nxxk.rate.generateCounts.v1',
  lastReportAt: 'nxxk.rate.lastReport.v1',
  viewedGreetings: 'nxxk.viewed.session',
} as const

export const RELATIONSHIP_OPTIONS = [
  'Friend',
  'Best Friend',
  'Partner',
  'Crush',
  'Sibling',
  'Parent',
  'Child',
  'Relative',
  'Colleague',
  'Mentor',
  'Classmate',
  'Other',
] as const
