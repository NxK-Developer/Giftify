import { GREETING_ID_LENGTH } from '@/constants/limits'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Cryptographically random base62 id, e.g. "Ab7Kx92". */
export function randomId(length: number = GREETING_ID_LENGTH): string {
  const bytes = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // Extremely defensive fallback (ancient environments) — still non-sequential.
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[(bytes[i] as number) % ALPHABET.length]
  }
  return out
}

/** Short id for toasts etc. (non security-sensitive). */
export function uid(prefix = ''): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
