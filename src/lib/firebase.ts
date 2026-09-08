/**
 * Firebase bootstrap — Authentication + Firestore ONLY.
 *
 * HARD CONSTRAINT (₹0 architecture, Version 1):
 *   Firebase Storage is never imported anywhere in this codebase, even if a
 *   storageBucket value exists in the environment. Media uploads are a
 *   future feature; the data model already separates "config" from "media"
 *   so Storage can be layered in later without rewrites.
 *
 * Everything here is lazily imported so the Firebase SDK stays out of the
 * initial bundle (landing page & demo paths never load it unless needed).
 */
import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import { firebaseEnv } from './env'

export interface FirebaseBundle {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

let bundlePromise: Promise<FirebaseBundle> | null = null

export function getFirebase(): Promise<FirebaseBundle> {
  if (!firebaseEnv) {
    return Promise.reject(new Error('Firebase is not configured (Demo Mode).'))
  }
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const [{ initializeApp }, { getAuth }, firestore] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ])
      const app = initializeApp(firebaseEnv!)
      const auth = getAuth(app)
      let db: Firestore
      try {
        db = firestore.initializeFirestore(app, {
          localCache: firestore.persistentLocalCache({
            tabManager: firestore.persistentMultipleTabManager(),
          }),
        })
      } catch {
        // Fall back to default in-memory/cache settings if persistence fails
        db = firestore.getFirestore(app)
      }
      return { app, auth, db }
    })()
    // Reset on failure so a later retry can re-attempt initialization.
    bundlePromise.catch(() => {
      bundlePromise = null
    })
  }
  return bundlePromise
}

/** Human-readable error mapping for Firebase auth/firestore failures. */
export function friendlyFirebaseError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and retry.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in the Firebase console.'
    case 'permission-denied':
      return 'You don’t have permission to do that.'
    case 'unavailable':
      return 'Firestore is unreachable — check your connection and retry.'
    case 'resource-exhausted':
      return 'Daily quota reached. Please try again later.'
    default: {
      const msg = error instanceof Error ? error.message : String(error ?? 'Unknown error')
      return msg.length > 140 ? 'Something went wrong. Please retry.' : msg
    }
  }
}
