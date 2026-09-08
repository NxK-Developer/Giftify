import type { Greeting } from '@/types'
import { isFirebaseConfigured } from '@/lib/env'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'
import { STORAGE_KEYS } from '@/constants/limits'
import { readJSON, writeJSON, sessionHas, sessionSet } from '@/utils/storage'
import { getSampleGreeting } from '@/constants/samples'

/**
 * analyticsService — honest, privacy-safe counters.
 *
 * Views: incremented at most once per browser session per greeting
 * (sessionStorage de-duplication). No personal data is collected — the
 * counter is anonymous by design. Firestore rules cap each write to a
 * small increment so the field can't be tampered with arbitrarily.
 *
 * Creator stats (drafts started / completed) are tracked locally and power
 * the dashboard "Completion Rate" metric — with the definition visible in
 * the UI, because it is a local device metric, not a fabricated number.
 */

export class AnalyticsError extends Error {}

function isLocalOnly(greeting: Greeting): boolean {
  return Boolean(greeting.isDemo) || Boolean(getSampleGreeting(greeting.id)) || !isFirebaseConfigured
}

function incrementLocal(id: string, field: 'views' | 'shares'): void {
  const store = readJSON<Record<string, Greeting>>(STORAGE_KEYS.demoGreetings, {})
  const g = store[id]
  if (g) {
    g[field] = (g[field] ?? 0) + 1
    store[id] = g
    writeJSON(STORAGE_KEYS.demoGreetings, store)
  }
}

export async function recordView(greeting: Greeting): Promise<void> {
  const key = `viewed:${greeting.id}`
  if (sessionHas(key)) return
  sessionSet(key)
  try {
    if (isLocalOnly(greeting)) {
      incrementLocal(greeting.id, 'views')
      return
    }
    const { db } = await getFirebase()
    const { doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore')
    await updateDoc(doc(db, 'greetings', greeting.id), {
      views: increment(1),
      lastViewedAt: serverTimestamp(),
    })
  } catch (err) {
    // View tracking must never break the recipient experience.
    console.warn('recordView failed:', friendlyFirebaseError(err))
  }
}

export async function recordShare(greeting: Greeting): Promise<void> {
  try {
    if (isLocalOnly(greeting)) {
      incrementLocal(greeting.id, 'shares')
      return
    }
    const { db } = await getFirebase()
    const { doc, updateDoc, increment } = await import('firebase/firestore')
    await updateDoc(doc(db, 'greetings', greeting.id), { shares: increment(1) })
  } catch (err) {
    console.warn('recordShare failed:', friendlyFirebaseError(err))
  }
}

/* ---------------------------------------------------------------------- */
/* Local creator stats (completion rate)                                   */
/* ---------------------------------------------------------------------- */

export interface CreatorStats {
  draftsStarted: number
  greetingsCompleted: number
}

export function getCreatorStats(): CreatorStats {
  return readJSON<CreatorStats>(STORAGE_KEYS.stats, {
    draftsStarted: 0,
    greetingsCompleted: 0,
  })
}

export function markDraftStarted(): void {
  const stats = getCreatorStats()
  stats.draftsStarted += 1
  writeJSON(STORAGE_KEYS.stats, stats)
}

export function markGreetingCompleted(): void {
  const stats = getCreatorStats()
  stats.greetingsCompleted += 1
  writeJSON(STORAGE_KEYS.stats, stats)
}

export function completionRate(): number {
  const stats = getCreatorStats()
  if (stats.draftsStarted === 0) return 0
  return Math.round((stats.greetingsCompleted / stats.draftsStarted) * 100)
}
