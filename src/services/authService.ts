import type { SessionUser } from '@/types'
import { isFirebaseConfigured } from '@/lib/env'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'
import { STORAGE_KEYS } from '@/constants/limits'
import { readJSON, writeJSON } from '@/utils/storage'
import { sanitizeLine } from '@/utils/sanitize'
import { LIMITS } from '@/constants/limits'

/**
 * authService — Firebase Authentication (Email/Password + Anonymous guest).
 *
 * Demo Mode (no Firebase env): no fake sign-in exists. Instead the app uses
 * an honestly-labeled local identity so the dashboard can be explored with
 * on-device data.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

function toSession(
  user: { uid: string; email: string | null; displayName: string | null; isAnonymous: boolean },
): SessionUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    isAnonymous: user.isAnonymous,
    isLocalDemo: false,
  }
}

/* ------------------------------ Demo mode ----------------------------- */

const LOCAL_DEMO_UID = 'demo-local-user'

export function getLocalDemoSession(): SessionUser {
  const stored = readJSON<{ displayName?: string } | null>(STORAGE_KEYS.demoIdentity, null)
  return {
    uid: LOCAL_DEMO_UID,
    email: null,
    displayName: sanitizeLine(stored?.displayName ?? '', LIMITS.displayName.max) || 'Demo Creator',
    isAnonymous: true,
    isLocalDemo: true,
  }
}

export function setLocalDemoDisplayName(name: string): void {
  writeJSON(STORAGE_KEYS.demoIdentity, {
    displayName: sanitizeLine(name, LIMITS.displayName.max),
  })
}

/* ------------------------------- Firebase ------------------------------ */

export async function signInWithEmail(email: string, password: string): Promise<SessionUser> {
  if (!isFirebaseConfigured) throw new AuthError('Sign-in is unavailable in Demo Mode.')
  try {
    const { auth } = await getFirebase()
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
    return toSession(cred.user)
  } catch (err) {
    throw new AuthError(friendlyFirebaseError(err))
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<SessionUser> {
  if (!isFirebaseConfigured) throw new AuthError('Sign-up is unavailable in Demo Mode.')
  try {
    const { auth } = await getFirebase()
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
    const name = sanitizeLine(displayName, LIMITS.displayName.max)
    const finalName = name || cred.user.displayName
    if (name) await updateProfile(cred.user, { displayName: name })
    return toSession({ ...cred.user, displayName: finalName })
  } catch (err) {
    throw new AuthError(friendlyFirebaseError(err))
  }
}

/** Guest mode — real Firebase anonymous auth (or local demo identity). */
export async function signInAsGuest(): Promise<SessionUser> {
  if (!isFirebaseConfigured) return getLocalDemoSession()
  try {
    const { auth } = await getFirebase()
    const { signInAnonymously } = await import('firebase/auth')
    const cred = await signInAnonymously(auth)
    return toSession(cred.user)
  } catch (err) {
    throw new AuthError(friendlyFirebaseError(err))
  }
}

/**
 * Upgrade an anonymous (guest) session to a full email account WITHOUT
 * losing the uid — so guest-created greetings stay attached to the account.
 */
export async function upgradeGuestToEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<SessionUser> {
  if (!isFirebaseConfigured) throw new AuthError('Sign-up is unavailable in Demo Mode.')
  try {
    const { auth } = await getFirebase()
    const { linkWithCredential, EmailAuthProvider, updateProfile } = await import('firebase/auth')
    const current = auth.currentUser
    if (!current?.isAnonymous) {
      return signUpWithEmail(email, password, displayName)
    }
    const credential = EmailAuthProvider.credential(email.trim(), password)
    const cred = await linkWithCredential(current, credential)
    const name = sanitizeLine(displayName, LIMITS.displayName.max)
    const finalName = name || cred.user.displayName
    if (name) await updateProfile(cred.user, { displayName: name })
    return toSession({ ...cred.user, displayName: finalName })
  } catch (err) {
    throw new AuthError(friendlyFirebaseError(err))
  }
}

export async function signOutUser(): Promise<void> {
  if (!isFirebaseConfigured) return
  try {
    const { auth } = await getFirebase()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
  } catch (err) {
    throw new AuthError(friendlyFirebaseError(err))
  }
}

/** Subscribe to auth state changes; returns an unsubscribe function. */
export function subscribeToAuth(
  callback: (user: SessionUser | null) => void,
): () => void {
  if (!isFirebaseConfigured) {
    // Demo mode has no auth stream; report signed-out (dashboard opts into
    // the local demo identity explicitly).
    callback(null)
    return () => undefined
  }
  let unsub: (() => void) | null = null
  let cancelled = false
  void getFirebase()
    .then(async ({ auth }) => {
      if (cancelled) return
      const { onAuthStateChanged } = await import('firebase/auth')
      unsub = onAuthStateChanged(auth, (user) => {
        callback(user ? toSession(user) : null)
      })
    })
    .catch(() => callback(null))
  return () => {
    cancelled = true
    unsub?.()
  }
}
