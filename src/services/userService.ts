import type { SessionUser, UserProfile, UserRole } from '@/types'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/env'
import { sanitizeLine } from '@/utils/sanitize'
import { LIMITS } from '@/constants/limits'

/**
 * userService — `users/{uid}` profile documents.
 * Role lives ONLY in Firestore and is validated by security rules;
 * clients can never grant themselves admin.
 */

export class UserServiceError extends Error {}

interface UserDoc {
  email?: string | null
  displayName?: string | null
  role?: UserRole
  createdAt?: { toDate?: () => Date } | string | null
  lastLoginAt?: { toDate?: () => Date } | string | null
  greetingCount?: number
}

function parseProfile(uid: string, data: UserDoc): UserProfile {
  const created =
    typeof data.createdAt === 'string'
      ? data.createdAt
      : (data.createdAt?.toDate?.() ?? new Date()).toISOString()
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    role: data.role === 'admin' ? 'admin' : 'user',
    createdAt: created,
    greetingCount: typeof data.greetingCount === 'number' ? data.greetingCount : 0,
  }
}

/** Create-or-refresh the profile doc after sign-in/sign-up (idempotent). */
export async function ensureUserProfile(session: SessionUser): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || session.isLocalDemo) return null
  try {
    const { db } = await getFirebase()
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore')
    const ref = doc(db, 'users', session.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      // Keep email/displayName fresh without touching role or createdAt.
      await setDoc(
        ref,
        {
          email: session.email,
          displayName: session.displayName,
          lastLoginAt: serverTimestamp() as unknown as string,
        },
        { merge: true },
      )
      const merged = { ...(snap.data() as UserDoc), email: session.email, displayName: session.displayName }
      return parseProfile(session.uid, merged)
    }
    const profile: UserDoc = {
      email: session.email,
      displayName: session.displayName,
      role: 'user', // rules enforce: users can only ever create role 'user'
      createdAt: serverTimestamp() as unknown as string,
      lastLoginAt: serverTimestamp() as unknown as string,
      greetingCount: 0,
    }
    await setDoc(ref, profile)
    return {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName,
      role: 'user',
      createdAt: new Date().toISOString(),
      greetingCount: 0,
    }
  } catch (err) {
    throw new UserServiceError(friendlyFirebaseError(err))
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null
  try {
    const { db } = await getFirebase()
    const { doc, getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return parseProfile(uid, snap.data() as UserDoc)
  } catch (err) {
    throw new UserServiceError(friendlyFirebaseError(err))
  }
}

export async function updateDisplayName(uid: string, name: string): Promise<void> {
  const clean = sanitizeLine(name, LIMITS.displayName.max)
  if (!isFirebaseConfigured) return
  try {
    const { db } = await getFirebase()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'users', uid), { displayName: clean || null })
    const { auth } = await getFirebase()
    const { updateProfile } = await import('firebase/auth')
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: clean })
  } catch (err) {
    throw new UserServiceError(friendlyFirebaseError(err))
  }
}

/** Admin-only (enforced by rules). */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  if (!isFirebaseConfigured) throw new UserServiceError('Unavailable in Demo Mode.')
  try {
    const { db } = await getFirebase()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'users', uid), { role })
  } catch (err) {
    throw new UserServiceError(friendlyFirebaseError(err))
  }
}
