import { useState, type FormEvent } from 'react'
import { useNow } from '@/hooks/useNow'
import { Link } from 'react-router-dom'
import { Lock, Hourglass, Flower2, ShieldAlert, Compass, EyeOff } from 'lucide-react'
import type { GreetingFetchResult } from '@/types'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import ParticleBackground from '@/components/background/ParticleBackground'
import { THEME_MAP } from '@/constants/themes'
import { RATE_LIMITS } from '@/constants/limits'
import { verifyGreetingPassword } from '@/services/greetingService'
import { formatCountdown, formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'

/**
 * GreetingGate — polished non-happy-path screens for /g/:id:
 * invalid, deleted, disabled, scheduled, expired and password-locked
 * greetings. Never a blank screen, never a raw error dump.
 */

function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[radial-gradient(120%_100%_at_50%_-10%,#1b1040_0%,#0b0616_55%,#050310_100%)]">
      <ParticleBackground theme={THEME_MAP.galaxy} baseCount={70} intensity={0.5} />
      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

function GateCard({
  icon,
  title,
  children,
  tone = 'violet',
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  tone?: 'violet' | 'gold' | 'rose' | 'slate'
}) {
  const toneClass = {
    violet: 'border-brand/25 text-brand-soft bg-brand/12',
    gold: 'border-gold/30 text-gold bg-gold/10',
    rose: 'border-rose-400/30 text-rose-300 bg-rose-400/10',
    slate: 'border-white/15 text-ink-dim bg-white/6',
  }[tone]
  return (
    <GlassCard strong className="p-7 text-center animate-scale-in">
      <span className={cn('mx-auto flex size-14 items-center justify-center rounded-2xl border', toneClass)} aria-hidden="true">
        {icon}
      </span>
      <h1 className="mt-5 font-display text-xl font-extrabold tracking-tight text-ink">{title}</h1>
      <div className="mt-3 text-sm leading-relaxed text-muted">{children}</div>
      <div className="mt-7 flex flex-col gap-2.5">
        <Button to="/create" size="md">
          ✨ Create your own greeting
        </Button>
        <Link to="/" className="text-xs font-semibold text-muted transition hover:text-ink">
          Back to home
        </Link>
      </div>
    </GlassCard>
  )
}

/* ---------------------------- Password lock ---------------------------- */

function PasswordGate({
  result,
  onUnlock,
}: {
  result: GreetingFetchResult
  onUnlock: (greeting: NonNullable<GreetingFetchResult['greeting']>) => void
}) {
  const [password, setPassword] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remaining = RATE_LIMITS.maxPasswordAttempts - attempts
  const locked = remaining <= 0

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!result.greeting || locked || checking) return
    setChecking(true)
    setError(null)
    const ok = await verifyGreetingPassword(result.greeting, password)
    setChecking(false)
    if (ok) {
      onUnlock(result.greeting)
    } else {
      setAttempts((a) => a + 1)
      setPassword('')
      setError('That’s not the password. Check with the person who sent this 💜')
    }
  }

  return (
    <GlassCard strong className="p-7 animate-scale-in">
      <div className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-brand/25 bg-brand/12 text-brand-soft" aria-hidden="true">
          <Lock className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-xl font-extrabold text-ink">This one’s locked 🔒</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          The sender protected this surprise with a password. Ask them for it — it’s usually something only the
          two of you would know 😉
        </p>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label htmlFor="gate-password" className="sr-only">
          Password
        </label>
        <input
          id="gate-password"
          type="password"
          value={password}
          disabled={locked || checking}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="off"
          className="min-h-12 w-full rounded-2xl border border-line bg-white/4 px-4 text-center font-mono text-sm tracking-widest text-ink placeholder:font-body placeholder:tracking-normal placeholder:text-muted/60 transition focus:border-brand-soft/70 focus:outline-none"
        />
        {error && !locked && (
          <p className="text-center text-xs text-danger" role="alert">
            {error} {remaining > 0 && `· ${remaining} attempt${remaining === 1 ? '' : 's'} left`}
          </p>
        )}
        {locked && (
          <p className="text-center text-xs text-danger" role="alert">
            Too many attempts. Reopen this link in a new tab session to try again.
          </p>
        )}
        <Button type="submit" fullWidth loading={checking} disabled={locked || !password}>
          Unlock the surprise
        </Button>
      </form>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-muted/80">
        Passwords are verified against a PBKDF2-SHA256 hash (150k iterations) — plaintext is never stored.
      </p>
      <div className="mt-5 text-center">
        <Link to="/" className="text-xs font-semibold text-muted transition hover:text-ink">
          Back to home
        </Link>
      </div>
    </GlassCard>
  )
}

/* --------------------------- Scheduled gate ---------------------------- */

function ScheduledGate({ scheduledAt }: { scheduledAt: string | null | undefined }) {
  const now = useNow(1000)
  const target = scheduledAt ? new Date(scheduledAt).getTime() : NaN
  const ready = now > 0 && !Number.isNaN(target) && now >= target

  return (
    <GateCard icon={<Hourglass className="size-6" />} title="This surprise isn’t ready yet ✨" tone="gold">
      <p>
        Someone scheduled this moment for <strong className="text-ink-dim">{formatDateTime(scheduledAt)}</strong>.
        {ready ? ' It should be open now — refresh the page!' : ' Come back then — punctual surprises hit different.'}
      </p>
      {!ready && !Number.isNaN(target) && (
        <p className="mt-4 rounded-2xl border border-gold/25 bg-gold/8 px-4 py-3 font-mono text-lg font-bold tracking-widest text-gold tabular-nums" aria-live="off">
          {now > 0 ? formatCountdown(target - now) : '…'}
        </p>
      )}
    </GateCard>
  )
}

/* ------------------------------ Router --------------------------------- */

export default function GreetingGate({
  result,
  onUnlock,
  onRetry,
}: {
  result: GreetingFetchResult
  onUnlock: (greeting: NonNullable<GreetingFetchResult['greeting']>) => void
  onRetry: () => void
}) {
  switch (result.state) {
    case 'password-required':
      return (
        <GateShell>
          <PasswordGate result={result} onUnlock={onUnlock} />
        </GateShell>
      )
    case 'scheduled':
      return (
        <GateShell>
          <ScheduledGate scheduledAt={result.scheduledAt} />
        </GateShell>
      )
    case 'expired':
      return (
        <GateShell>
          <GateCard icon={<Flower2 className="size-6" />} title="This greeting has expired 🥀" tone="rose">
            <p>
              Its moment has passed — the sender set an end date, and time (as always) won. The good news: you
              can send someone your own surprise right now.
            </p>
          </GateCard>
        </GateShell>
      )
    case 'disabled':
      return (
        <GateShell>
          <GateCard icon={<ShieldAlert className="size-6" />} title="This greeting is unavailable" tone="slate">
            <p>
              This link was disabled after review. If you believe that’s a mistake, the creator can reach out to
              the moderators.
            </p>
          </GateCard>
        </GateShell>
      )
    case 'error':
      return (
        <GateShell>
          <ErrorState
            title="Couldn’t load this greeting"
            message={result.error ?? 'A network hiccup got in the way. Your surprise is probably fine — try once more.'}
            onRetry={onRetry}
            secondaryAction={
              <Button to="/create" variant="ghost" size="sm">
                Create your own
              </Button>
            }
          />
        </GateShell>
      )
    case 'not-found':
    default:
      return (
        <GateShell>
          <GateCard icon={<Compass className="size-6" />} title="This link doesn’t lead anywhere 🌑" tone="slate">
            <p>
              <EyeOff className="mr-1 inline size-3.5" aria-hidden="true" />
              The greeting may have been deleted, made private, or the link was mistyped. Nothing is broken on
              your end.
            </p>
            <p className="mt-3 font-mono text-[11px] tracking-widest text-muted/70">
              Tip: links look like <span className="text-brand-soft">/g/Ab7Kx92</span>
            </p>
          </GateCard>
        </GateShell>
      )
  }
}
