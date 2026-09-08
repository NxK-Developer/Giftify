import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ShieldX, ServerCog } from 'lucide-react'
import { useAuth } from '@/store/AuthContext'
import LoadingScreen from './LoadingScreen'
import ErrorState from './ErrorState'

/**
 * Route guards.
 *
 * RequireSession: in Demo Mode the dashboard is openly explorable with the
 * on-device demo identity (clearly labeled inside). With Firebase enabled,
 * a real session is required — no bypasses.
 *
 * RequireAdmin: mirrors `users/{uid}.role === 'admin'`. The REAL enforcement
 * lives in firestore.rules; this guard only avoids rendering admin UI for
 * non-admins. Admin data operations independently fail server-side.
 */

export function RequireSession({ children }: { children: ReactNode }) {
  const { status, session, isDemoMode } = useAuth()
  const location = useLocation()

  if (isDemoMode) return <>{children}</>
  if (status === 'loading') return <LoadingScreen label="Checking your session…" />
  if (!session) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname + location.search }} />
  }
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status, session, profile, isAdmin, isDemoMode } = useAuth()
  const location = useLocation()

  if (isDemoMode) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ErrorState
          icon={<ServerCog className="size-7" aria-hidden="true" />}
          title="Admin panel needs Firebase"
          message="Admin tools operate on live Firestore data and enforce authorization through security rules. This session is in Demo Mode (no Firebase configured), so there is nothing to administer — and pretending otherwise would be fake."
          secondaryAction={undefined}
        />
      </div>
    )
  }

  if (status === 'loading') return <LoadingScreen label="Verifying access…" />
  if (!session) {
    return <Navigate to="/login" replace state={{ returnTo: location.pathname }} />
  }
  // Session exists but the profile document hasn't resolved yet.
  if (!profile) {
    return <LoadingScreen label="Loading your profile…" />
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <ErrorState
          icon={<ShieldX className="size-7" aria-hidden="true" />}
          title="Admin access only"
          message="Your account doesn’t have the admin role. Authorization is enforced by Firestore security rules — not by hiding this page. If you own this project, set role: 'admin' on your users/{uid} document via the Firebase Console (see README)."
        />
      </div>
    )
  }
  return <>{children}</>
}
