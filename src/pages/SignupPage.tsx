import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, ShieldCheck, UserRound } from 'lucide-react'
import AuthLayout from '@/components/common/AuthLayout'
import Button from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import Toggle from '@/components/common/Toggle'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { validateCredentials } from '@/utils/validate'
import { sanitizeLine } from '@/utils/sanitize'
import { LIMITS } from '@/constants/limits'
import { AuthError } from '@/services/authService'

export default function SignupPage() {
  useSeo({
    title: 'Create your account — NxK Greetings',
    description: 'Save greetings to the cloud, track views and shares, and keep your drafts across devices — free.',
    canonicalPath: '/signup',
    noindex: true,
  })
  const { signUpWithEmail, continueAsGuest, session, isDemoMode, status } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/dashboard'

  const isUpgradingGuest = Boolean(session?.isAnonymous && !session?.isLocalDemo)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'signup' | 'guest' | null>(null)
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; form?: string }>({})
  const [keepMeHonest, setKeepMeHonest] = useState(true) // small delight: content kindness pledge

  if (status === 'signed-in' && !isDemoMode && !isUpgradingGuest) {
    return <Navigate to={returnTo} replace />
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const name = sanitizeLine(displayName, LIMITS.displayName.max)
    const issues = validateCredentials(email, password)
    if (issues.length > 0 || !name) {
      setErrors({
        displayName: !name ? 'Tell us what to call you' : undefined,
        email: issues.find((i) => i.field === 'email')?.message,
        password: issues.find((i) => i.field === 'password')?.message,
      })
      return
    }
    setErrors({})
    setBusy('signup')
    try {
      await signUpWithEmail(email, password, name)
      pushToast('success', isUpgradingGuest ? 'Guest data secured 🎉' : `Welcome, ${name} ✨`, isUpgradingGuest ? 'Your anonymous greetings are now attached to your account.' : 'Your account is ready — let’s make something beautiful.')
      navigate(returnTo, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Sign-up failed. Please retry.' })
    } finally {
      setBusy(null)
    }
  }

  const guest = async () => {
    setBusy('guest')
    try {
      await continueAsGuest()
      navigate(returnTo, { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof AuthError ? err.message : 'Guest mode failed. Please retry.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <AuthLayout
      title={isUpgradingGuest ? 'Secure your guest data' : 'Create your account'}
      subtitle={
        isUpgradingGuest
          ? 'You’re browsing as a guest. Create an account now — your uid (and every greeting) carries over automatically.'
          : 'Save greetings to the cloud, track views & shares, and keep drafts across devices. Free, always.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={{ returnTo }} className="font-semibold text-brand-soft transition hover:text-accent-soft">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Display name"
          placeholder="e.g. Nishant"
          autoComplete="nickname"
          value={displayName}
          disabled={isDemoMode || busy !== null}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          counter={{ current: sanitizeLine(displayName, 99).length, max: LIMITS.displayName.max }}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          disabled={isDemoMode || busy !== null}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="Stored only by Firebase Authentication — we never see it."
        />

        <div className="rounded-2xl border border-line bg-white/3 p-3.5">
          <Toggle
            checked={keepMeHonest}
            onChange={setKeepMeHonest}
            label="I’ll keep it kind 💜"
            description="No spam, harassment or inappropriate content. Reports are reviewed and greetings can be disabled."
          />
        </div>

        {errors.form && (
          <p className="rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[12.5px] text-danger" role="alert">
            {errors.form}
          </p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={busy === 'signup'}
          disabled={isDemoMode || !keepMeHonest}
          icon={<Sparkles className="size-4" />}
        >
          {isUpgradingGuest ? 'Upgrade guest → account' : 'Create account'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-widest text-muted uppercase" aria-hidden="true">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <Button fullWidth variant="secondary" size="lg" loading={busy === 'guest'} onClick={guest} icon={<UserRound className="size-4" />}>
        {isDemoMode ? 'Explore in Demo Mode' : 'Continue as Guest'}
      </Button>

      <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-muted">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
        Security notes: passwords are handled by Firebase Auth (we can’t read them); your profile role can’t be
        self-assigned; Firestore rules block anyone from touching greetings that aren’t theirs.
      </p>
    </AuthLayout>
  )
}
