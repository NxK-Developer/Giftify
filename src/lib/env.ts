/**
 * Typed environment access + Demo Mode detection.
 *
 * Demo Mode: when the Firebase env vars are missing, the app runs fully
 * client-side. It is always clearly labeled — nothing pretends to be
 * "saved to the cloud" and no fake auth exists.
 */

export interface FirebaseEnv {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function env(name: string): string {
  const value = import.meta.env[name]
  return typeof value === 'string' ? value.trim() : ''
}

export function getFirebaseEnv(): FirebaseEnv | null {
  const cfg: FirebaseEnv = {
    apiKey: env('VITE_FIREBASE_API_KEY'),
    authDomain: env('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: env('VITE_FIREBASE_PROJECT_ID'),
    // Accepted for future use — Firebase Storage is NEVER imported in v1.
    storageBucket: env('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: env('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: env('VITE_FIREBASE_APP_ID'),
  }
  const ready = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)
  return ready ? cfg : null
}

export const firebaseEnv = getFirebaseEnv()

/** True when real Firebase services are available. */
export const isFirebaseConfigured = firebaseEnv !== null

/** Public origin used for share links / canonical URLs. */
export function getAppUrl(): string {
  const configured = env('VITE_APP_URL')
  if (configured) return configured.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}
