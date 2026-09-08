import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthStatus, SessionUser, UserProfile } from '@/types'
import { isFirebaseConfigured } from '@/lib/env'
import * as authService from '@/services/authService'
import { ensureUserProfile, getUserProfile } from '@/services/userService'

/**
 * AuthContext — Firebase Auth session + Firestore profile (role).
 *
 * Demo Mode (no Firebase env): `isDemoMode` is true, `session` stays null
 * unless the user explicitly continues with the on-device demo identity
 * (clearly labeled everywhere). Nothing pretends to be a real account.
 */

interface AuthContextValue {
  session: SessionUser | null
  profile: UserProfile | null
  status: AuthStatus
  isAdmin: boolean
  isDemoMode: boolean
  isFirebaseReady: boolean
  /** Effective owner id for creating greetings */
  ownerId: string | null
  signInWithEmail: (email: string, password: string) => Promise<SessionUser>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<SessionUser>
  continueAsGuest: () => Promise<SessionUser>
  upgradeGuest: (email: string, password: string, displayName: string) => Promise<SessionUser>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() => (isFirebaseConfigured ? 'loading' : 'signed-out'))
  const [demoSession, setDemoSession] = useState<SessionUser | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = authService.subscribeToAuth((user) => {
      setSession(user)
      setStatus(user ? 'signed-in' : 'signed-out')
      if (!user) setProfile(null)
    })
    return unsub
  }, [])

  // Load/refresh the profile document (role) whenever the session changes.
  useEffect(() => {
    if (!session || session.isLocalDemo) return
    let cancelled = false
    void (async () => {
      try {
        let p = await ensureUserProfile(session)
        if (!p) p = await getUserProfile(session.uid)
        if (!cancelled) setProfile(p)
      } catch {
        if (!cancelled) setProfile(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [session])

  const refreshProfile = useCallback(async () => {
    if (!session || session.isLocalDemo) return
    try {
      const p = await getUserProfile(session.uid)
      setProfile(p)
    } catch {
      /* keep current */
    }
  }, [session])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const s = await authService.signInWithEmail(email, password)
    setSession(s)
    setStatus('signed-in')
    return s
  }, [])

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      const s = session?.isAnonymous && !session.isLocalDemo
        ? await authService.upgradeGuestToEmail(email, password, displayName)
        : await authService.signUpWithEmail(email, password, displayName)
      setSession(s)
      setStatus('signed-in')
      return s
    },
    [session],
  )

  const continueAsGuest = useCallback(async () => {
    if (!isFirebaseConfigured) {
      const local = authService.getLocalDemoSession()
      setDemoSession(local)
      setStatus('signed-in')
      return local
    }
    const s = await authService.signInAsGuest()
    setSession(s)
    setStatus('signed-in')
    return s
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOutUser()
    setSession(null)
    setDemoSession(null)
    setProfile(null)
    setStatus('signed-out')
  }, [])

  const effectiveSession = session ?? demoSession

  // Local demo identities have no Firestore profile — never leak stale roles.
  const effectiveProfile = session?.isLocalDemo ? null : profile

  const value = useMemo<AuthContextValue>(
    () => ({
      session: effectiveSession,
      profile: effectiveProfile,
      status,
      isAdmin: effectiveProfile?.role === 'admin',
      isDemoMode: !isFirebaseConfigured,
      isFirebaseReady: isFirebaseConfigured,
      ownerId: effectiveSession?.uid ?? null,
      signInWithEmail,
      signUpWithEmail,
      continueAsGuest,
      upgradeGuest: signUpWithEmail,
      signOut,
      refreshProfile,
    }),
    [effectiveSession, effectiveProfile, status, signInWithEmail, signUpWithEmail, continueAsGuest, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
