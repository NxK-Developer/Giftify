import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, UserRound } from 'lucide-react'
import AuthLayout from '@/components/common/AuthLayout'
import Button from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { validateCredentials } from '@/utils/validate'
import { AuthError } from '@/services/authService'

export default function LoginPage() {
  useSeo({
    title: 'Log in — NxK Greetings',
    description: 'Sign in to manage your cinematic greetings, view stats and share surprises.',
    canonicalPath: '/login',
    noindex: true,
  })
  const { signInWithEmail, continueAsGuest, isDemoMode, status } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'login' | 'guest' | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const issues = validateCredentials(email, password)
    if (issues.length > 0) {
      setErrors({
        email: issues.find((i) => i.field === 'email')?.message,
        password: issues.find((i) => i.field === 'password')?.message,
      })
      return
    }
    setErrors({})
    setBusy('login')
    try {
      const session = await signInWithEmail(email, password)
      pushToast('success', `Welcome back${session.displayName ? `, ${session.displayName}` : ''} 👋`)
      navigate(returnTo, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Sign-in failed. Please retry.' })
    } finally {
      setBusy(null)
    }
  }

  const guest = async () => {
    setBusy('guest')
    try {
      await continueAsGuest()
      pushToast('info', isDemoMode ? 'Exploring in Demo Mode' : 'Guest session started', isDemoMode ? 'Your work stays on this device.' : 'Create an account anytime to keep your greetings across devices.')
      navigate(returnTo, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Guest mode failed. Please retry.' })
    } finally {
      setBusy(null)
    }
  }

  // Already signed in? Straight to the dashboard.
  if (status === 'signed-in' && !isDemoMode) {
    return <Navigate to={returnTo} replace />
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your greetings, stats and drafts."
      footer={
        <>
          New here?{' '}
          <Link to="/signup" state={{ returnTo }} className="font-semibold text-brand-soft transition hover:text-accent-soft">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          disabled={isDemoMode || busy !== null}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          disabled={isDemoMode || busy !== null}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        {errors.form && (
          <p className="rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[12.5px] text-danger" role="alert">
            {errors.form}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={busy === 'login'} disabled={isDemoMode} icon={<LogIn className="size-4" />}>
          Log in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-widest text-muted uppercase" aria-hidden="true">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <Button fullWidth variant="secondary" size="lg" loading={busy === 'guest'} onClick={guest} icon={<UserRound className="size-4" />}>
        {isDemoMode ? 'Explore in Demo Mode' : 'Continue as Guest'}
      </Button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
        {isDemoMode
          ? 'No account is created in Demo Mode — your data stays in this browser.'
          : 'Guests get a real anonymous session. Sign up later and keep everything — your uid never changes.'}
      </p>
    </AuthLayout>
  )
}
