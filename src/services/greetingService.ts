import type {
  CreateGreetingInput,
  CreateGreetingResult,
  Greeting,
  GreetingFetchResult,
  PrivacyMode,
} from '@/types'
import { isFirebaseConfigured, getAppUrl } from '@/lib/env'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'
import { randomId } from '@/utils/id'
import { sanitizeLine, sanitizeMultiline } from '@/utils/sanitize'
import { LIMITS, STORAGE_KEYS, RATE_LIMITS } from '@/constants/limits'
import { isWellFormedGreeting, normalizeGreeting } from '@/utils/validate'
import { readJSON, writeJSON } from '@/utils/storage'
import { hashPassword, verifyPassword } from '@/utils/hash'
import { getSampleGreeting } from '@/constants/samples'

/**
 * greetingService — create/read/update/delete greetings.
 *
 * Backend strategy (₹0 architecture):
 *  - Firebase configured  → Firestore `greetings/{greetingId}` documents,
 *    server timestamps, security-rule enforced ownership & privacy.
 *  - Demo Mode            → an on-device store (localStorage). Demo results
 *    are always flagged `isDemo: true` and the UI labels them honestly.
 *
 * Firebase Storage is never used: a greeting document stores configuration
 * only (text, names, ids). A future `mediaRefs` field can point at Storage
 * paths without touching any of this code.
 */

export class GreetingError extends Error {}

/* ---------------------------------------------------------------------- */
/* Local (demo) backend                                                    */
/* ---------------------------------------------------------------------- */

function readLocalStore(): Record<string, Greeting> {
  return readJSON<Record<string, Greeting>>(STORAGE_KEYS.demoGreetings, {})
}

function writeLocalStore(store: Record<string, Greeting>): void {
  writeJSON(STORAGE_KEYS.demoGreetings, store)
}

/* ---------------------------------------------------------------------- */
/* Rate limiting (client-side abuse protection)                            */
/* ---------------------------------------------------------------------- */

export interface RateLimitVerdict {
  allowed: boolean
  reason?: string
}

export function checkGenerateRateLimit(): RateLimitVerdict {
  const now = Date.now()
  const last = readJSON<number>(STORAGE_KEYS.lastGenerateAt, 0)
  if (now - last < RATE_LIMITS.minGenerateIntervalMs) {
    const wait = Math.ceil((RATE_LIMITS.minGenerateIntervalMs - (now - last)) / 1000)
    return { allowed: false, reason: `Hold on — you can create another greeting in ${wait}s.` }
  }
  const dayMs = 86_400_000
  const counts = readJSON<number[]>(STORAGE_KEYS.generateCounts, [])
  const recent = counts.filter((t) => now - t < dayMs)
  if (recent.length >= RATE_LIMITS.maxGenerationsPerDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${RATE_LIMITS.maxGenerationsPerDay} greetings/day per device). Try again tomorrow.`,
    }
  }
  return { allowed: true }
}

function recordGeneration(): void {
  const now = Date.now()
  writeJSON(STORAGE_KEYS.lastGenerateAt, now)
  const dayMs = 86_400_000
  const counts = readJSON<number[]>(STORAGE_KEYS.generateCounts, []).filter((t) => now - t < dayMs)
  counts.push(now)
  writeJSON(STORAGE_KEYS.generateCounts, counts)
}

/* ---------------------------------------------------------------------- */
/* Firestore mapping                                                       */
/* ---------------------------------------------------------------------- */

interface FirestoreTimestampLike {
  toDate: () => Date
}

function tsToIso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as FirestoreTimestampLike).toDate().toISOString()
  }
  return null
}

function docToGreeting(id: string, data: Record<string, unknown>): Greeting | null {
  const candidate = {
    id,
    ownerId: String(data.ownerId ?? ''),
    occasion: data.occasion,
    templateId: String(data.templateId ?? ''),
    recipientName: String(data.recipientName ?? ''),
    senderName: String(data.senderName ?? ''),
    nickname: String(data.nickname ?? ''),
    relationship: String(data.relationship ?? ''),
    specialDate: String(data.specialDate ?? ''),
    message: String(data.message ?? ''),
    theme: data.theme,
    animation: data.animation,
    music: data.music,
    privacy: data.privacy,
    status: data.status === 'disabled' ? 'disabled' : 'active',
    views: Number(data.views ?? 0),
    shares: Number(data.shares ?? 0),
    scheduledAt: tsToIso(data.scheduledAt),
    expiresAt: tsToIso(data.expiresAt),
    passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : null,
    passwordSalt: typeof data.passwordSalt === 'string' ? data.passwordSalt : null,
    createdAt: tsToIso(data.createdAt) ?? new Date(0).toISOString(),
    updatedAt: tsToIso(data.updatedAt),
  } as unknown as Greeting
  if (!isWellFormedGreeting(candidate)) return null
  return normalizeGreeting(candidate)
}

/* ---------------------------------------------------------------------- */
/* Public API                                                              */
/* ---------------------------------------------------------------------- */

export function buildGreetingUrl(id: string): string {
  return `${getAppUrl()}/g/${id}`
}

function shouldUseFirestore(): boolean {
  return isFirebaseConfigured
}

/** Sanitize + assemble the stored payload from creator input. */
function sanitizeInput(input: CreateGreetingInput): CreateGreetingInput {
  return {
    ...input,
    recipientName: sanitizeLine(input.recipientName, LIMITS.recipientName.max),
    senderName: sanitizeLine(input.senderName, LIMITS.senderName.max),
    nickname: sanitizeLine(input.nickname, LIMITS.nickname.max),
    relationship: sanitizeLine(input.relationship, LIMITS.relationship.max),
    message: sanitizeMultiline(input.message, LIMITS.message.max),
    specialDate: sanitizeLine(input.specialDate, 24),
    templateId: sanitizeLine(input.templateId, 40),
  }
}

export async function createGreeting(
  input: CreateGreetingInput,
  ownerId: string,
  opts?: { forceLocal?: boolean },
): Promise<CreateGreetingResult> {
  const rate = checkGenerateRateLimit()
  if (!rate.allowed) throw new GreetingError(rate.reason ?? 'Rate limited.')

  const clean = sanitizeInput(input)
  if (!clean.recipientName || !clean.message) {
    throw new GreetingError('Recipient name and message are required.')
  }

  let passwordHash: string | null = null
  let passwordSalt: string | null = null
  if (input.password) {
    const hashed = await hashPassword(input.password)
    passwordHash = hashed.hash
    passwordSalt = hashed.salt
  }

  if (shouldUseFirestore() && !opts?.forceLocal) {
    try {
      const { db } = await getFirebase()
      const {
        doc,
        getDoc,
        setDoc,
        serverTimestamp,
        Timestamp,
        increment,
      } = await import('firebase/firestore')

      // Collision-safe id generation (62^7 ≈ 3.5 trillion combinations;
      // we still verify uniqueness before writing).
      let id = randomId()
      for (let attempt = 0; attempt < 5; attempt++) {
        const probe = await getDoc(doc(db, 'greetings', id))
        if (!probe.exists()) break
        id = randomId()
      }

      await setDoc(doc(db, 'greetings', id), {
        ownerId,
        occasion: clean.occasion,
        templateId: clean.templateId,
        recipientName: clean.recipientName,
        senderName: clean.senderName,
        nickname: clean.nickname,
        relationship: clean.relationship,
        specialDate: clean.specialDate,
        message: clean.message,
        theme: clean.theme,
        animation: clean.animation,
        music: clean.music,
        privacy: clean.privacy,
        status: 'active',
        views: 0,
        shares: 0,
        scheduledAt: clean.scheduledAt ? Timestamp.fromDate(clean.scheduledAt) : null,
        expiresAt: clean.expiresAt ? Timestamp.fromDate(clean.expiresAt) : null,
        passwordHash,
        passwordSalt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Best-effort profile counter (failure here must not break creation).
      try {
        const { doc: userDoc, updateDoc } = await import('firebase/firestore')
        await updateDoc(userDoc(db, 'users', ownerId), { greetingCount: increment(1) }).catch(
          () => undefined,
        )
      } catch {
        /* ignore */
      }

      recordGeneration()
      return { id, url: buildGreetingUrl(id), isDemo: false }
    } catch (err) {
      throw new GreetingError(friendlyFirebaseError(err))
    }
  }

  /* ------------------------------ Demo mode ----------------------------- */
  const store = readLocalStore()
  let id = randomId()
  let guard = 0
  while (store[id] && guard++ < 20) id = randomId()

  const now = new Date().toISOString()
  const greeting: Greeting = {
    id,
    ownerId,
    occasion: clean.occasion,
    templateId: clean.templateId,
    recipientName: clean.recipientName,
    senderName: clean.senderName,
    nickname: clean.nickname,
    relationship: clean.relationship,
    specialDate: clean.specialDate,
    message: clean.message,
    theme: clean.theme,
    animation: clean.animation,
    music: clean.music,
    privacy: clean.privacy,
    status: 'active',
    views: 0,
    shares: 0,
    scheduledAt: clean.scheduledAt ? clean.scheduledAt.toISOString() : null,
    expiresAt: clean.expiresAt ? clean.expiresAt.toISOString() : null,
    passwordHash,
    passwordSalt,
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  }
  store[id] = greeting
  writeLocalStore(store)
  recordGeneration()
  return { id, url: buildGreetingUrl(id), isDemo: true }
}

/**
 * Fetch a greeting for a recipient and classify its state.
 * Permission-denied (private greetings) is intentionally reported as
 * not-found so existence is never leaked.
 */
export async function fetchGreeting(id: string): Promise<GreetingFetchResult> {
  const cleanId = id.trim()
  if (!cleanId || cleanId.length > 24 || !/^[A-Za-z0-9_-]+$/.test(cleanId)) {
    return { state: 'not-found' }
  }

  if (shouldUseFirestore()) {
    try {
      const { db } = await getFirebase()
      const { doc, getDoc } = await import('firebase/firestore')
      const snap = await getDoc(doc(db, 'greetings', cleanId))
      if (snap.exists()) {
        const greeting = docToGreeting(cleanId, snap.data() as Record<string, unknown>)
        if (!greeting) return { state: 'not-found' }
        return classifyGreeting(greeting)
      }
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : ''
      if (code === 'permission-denied') return { state: 'not-found' }
      // Network/firestore failure: fall through to local samples so demo
      // greetings still resolve on this device.
    }
  }

  // Local demo store
  const local = readLocalStore()[cleanId]
  if (local && isWellFormedGreeting(local)) return classifyGreeting(normalizeGreeting(local))

  // Built-in fictional samples (always available, labeled demo)
  const sample = getSampleGreeting(cleanId)
  if (sample) return { state: 'ok', greeting: sample }

  return { state: 'not-found' }
}

function classifyGreeting(greeting: Greeting): GreetingFetchResult {
  const now = Date.now()
  if (greeting.status === 'disabled') return { state: 'disabled', greeting }
  if (greeting.scheduledAt && new Date(greeting.scheduledAt).getTime() > now) {
    return { state: 'scheduled', greeting, scheduledAt: greeting.scheduledAt }
  }
  if (greeting.expiresAt && new Date(greeting.expiresAt).getTime() < now) {
    return { state: 'expired', greeting }
  }
  if (greeting.passwordHash) return { state: 'password-required', greeting }
  return { state: 'ok', greeting }
}

/** Verify a recipient-entered password against the stored PBKDF2 hash. */
export async function verifyGreetingPassword(greeting: Greeting, password: string): Promise<boolean> {
  if (!greeting.passwordHash || !greeting.passwordSalt) return true
  return verifyPassword(password, greeting.passwordHash, greeting.passwordSalt)
}

/** List greetings owned by `ownerId`, newest first. */
export async function listMyGreetings(ownerId: string): Promise<Greeting[]> {
  if (shouldUseFirestore()) {
    try {
      const { db } = await getFirebase()
      const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore')
      const q = query(
        collection(db, 'greetings'),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc'),
        limit(200),
      )
      const snap = await getDocs(q)
      const out: Greeting[] = []
      snap.forEach((d) => {
        const g = docToGreeting(d.id, d.data() as Record<string, unknown>)
        if (g) out.push(g)
      })
      return out
    } catch (err) {
      throw new GreetingError(friendlyFirebaseError(err))
    }
  }
  const store = readLocalStore()
  return Object.values(store)
    .filter((g) => g.ownerId === ownerId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

/** Owner updates (message/privacy/schedule etc.). Status changes go via adminService. */
export async function updateGreeting(
  id: string,
  ownerId: string,
  patch: Partial<
    Pick<
      Greeting,
      | 'recipientName'
      | 'senderName'
      | 'nickname'
      | 'relationship'
      | 'specialDate'
      | 'message'
      | 'theme'
      | 'animation'
      | 'music'
      | 'privacy'
      | 'occasion'
      | 'templateId'
    >
  > & { scheduledAt?: Date | null; expiresAt?: Date | null },
): Promise<void> {
  if (shouldUseFirestore()) {
    try {
      const { db } = await getFirebase()
      const { doc, getDoc, updateDoc, serverTimestamp, Timestamp } = await import('firebase/firestore')
      const ref = doc(db, 'greetings', id)
      const snap = await getDoc(ref)
      if (!snap.exists()) throw new GreetingError('This greeting no longer exists.')
      if (snap.data().ownerId !== ownerId) throw new GreetingError('You can only edit your own greetings.')
      const data: Record<string, unknown> = { updatedAt: serverTimestamp() }
      if (patch.recipientName !== undefined)
        data.recipientName = sanitizeLine(patch.recipientName, LIMITS.recipientName.max)
      if (patch.senderName !== undefined)
        data.senderName = sanitizeLine(patch.senderName, LIMITS.senderName.max)
      if (patch.nickname !== undefined) data.nickname = sanitizeLine(patch.nickname, LIMITS.nickname.max)
      if (patch.relationship !== undefined)
        data.relationship = sanitizeLine(patch.relationship, LIMITS.relationship.max)
      if (patch.specialDate !== undefined) data.specialDate = sanitizeLine(patch.specialDate, 24)
      if (patch.message !== undefined) data.message = sanitizeMultiline(patch.message, LIMITS.message.max)
      for (const key of ['theme', 'animation', 'music', 'privacy', 'occasion', 'templateId'] as const) {
        if (patch[key] !== undefined) data[key] = patch[key]
      }
      if (patch.scheduledAt !== undefined)
        data.scheduledAt = patch.scheduledAt ? Timestamp.fromDate(patch.scheduledAt) : null
      if (patch.expiresAt !== undefined)
        data.expiresAt = patch.expiresAt ? Timestamp.fromDate(patch.expiresAt) : null
      await updateDoc(ref, data)
      return
    } catch (err) {
      if (err instanceof GreetingError) throw err
      throw new GreetingError(friendlyFirebaseError(err))
    }
  }
  const store = readLocalStore()
  const existing = store[id]
  if (!existing) throw new GreetingError('This greeting no longer exists.')
  if (existing.ownerId !== ownerId) throw new GreetingError('You can only edit your own greetings.')
  store[id] = {
    ...existing,
    ...patch,
    recipientName:
      patch.recipientName !== undefined
        ? sanitizeLine(patch.recipientName, LIMITS.recipientName.max)
        : existing.recipientName,
    message:
      patch.message !== undefined
        ? sanitizeMultiline(patch.message, LIMITS.message.max)
        : existing.message,
    scheduledAt:
      patch.scheduledAt !== undefined
        ? patch.scheduledAt
          ? patch.scheduledAt.toISOString()
          : null
        : existing.scheduledAt,
    expiresAt:
      patch.expiresAt !== undefined
        ? patch.expiresAt
          ? patch.expiresAt.toISOString()
          : null
        : existing.expiresAt,
    updatedAt: new Date().toISOString(),
  }
  writeLocalStore(store)
}

export async function deleteGreeting(id: string, ownerId: string): Promise<void> {
  if (shouldUseFirestore()) {
    try {
      const { db } = await getFirebase()
      const { doc, getDoc, deleteDoc, increment, updateDoc } = await import('firebase/firestore')
      const ref = doc(db, 'greetings', id)
      const snap = await getDoc(ref)
      if (!snap.exists()) return // already gone — idempotent success
      if (snap.data().ownerId !== ownerId)
        throw new GreetingError('You can only delete your own greetings.')
      await deleteDoc(ref)
      try {
        await updateDoc(doc(db, 'users', ownerId), { greetingCount: increment(-1) }).catch(() => undefined)
      } catch {
        /* ignore */
      }
      return
    } catch (err) {
      if (err instanceof GreetingError) throw err
      throw new GreetingError(friendlyFirebaseError(err))
    }
  }
  const store = readLocalStore()
  if (store[id] && store[id]?.ownerId === ownerId) {
    delete store[id]
    writeLocalStore(store)
  }
}

/** Duplicate an existing greeting into a fresh one owned by `ownerId`. */
export async function duplicateGreeting(
  source: Greeting,
  ownerId: string,
): Promise<CreateGreetingResult> {
  const input: CreateGreetingInput = {
    occasion: source.occasion,
    templateId: source.templateId,
    recipientName: source.recipientName,
    senderName: source.senderName,
    nickname: source.nickname,
    relationship: source.relationship,
    specialDate: source.specialDate,
    message: source.message,
    theme: source.theme,
    animation: source.animation,
    music: source.music,
    privacy: (source.privacy ?? 'unlisted') as PrivacyMode,
    scheduledAt: source.scheduledAt ? new Date(source.scheduledAt) : null,
    expiresAt: source.expiresAt ? new Date(source.expiresAt) : null,
    password: null,
  }
  return createGreeting(input, ownerId)
}

/** Copy a demo (on-device) greeting into Firestore after real sign-in. */
export async function promoteDemoGreeting(
  greeting: Greeting,
  ownerId: string,
): Promise<CreateGreetingResult> {
  if (!shouldUseFirestore()) {
    throw new GreetingError('Cloud saving needs Firebase configured. You are in Demo Mode.')
  }
  const input: CreateGreetingInput = {
    occasion: greeting.occasion,
    templateId: greeting.templateId,
    recipientName: greeting.recipientName,
    senderName: greeting.senderName,
    nickname: greeting.nickname,
    relationship: greeting.relationship,
    specialDate: greeting.specialDate,
    message: greeting.message,
    theme: greeting.theme,
    animation: greeting.animation,
    music: greeting.music,
    privacy: greeting.privacy,
    scheduledAt: greeting.scheduledAt ? new Date(greeting.scheduledAt) : null,
    expiresAt: greeting.expiresAt ? new Date(greeting.expiresAt) : null,
    password: null,
  }
  const result = await createGreeting(input, ownerId)
  // Remove the local copy so the dashboard doesn't show duplicates.
  const store = readLocalStore()
  if (store[greeting.id]) {
    delete store[greeting.id]
    writeLocalStore(store)
  }
  return result
}
