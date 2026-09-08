import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ServerCog,
  ShieldCheck,
  Gauge,
  Lock,
  Rocket,
  Copy,
  Check,
  LogOut,
  Database,
  TriangleAlert,
} from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import GlassCard from '@/components/common/GlassCard'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'
import { useAuth } from '@/store/AuthContext'
import { firebaseEnv, isFirebaseConfigured, getAppUrl } from '@/lib/env'
import { LIMITS, RATE_LIMITS, GREETING_ID_LENGTH } from '@/constants/limits'
import { copyText } from '@/services/shareService'
import { BRAND } from '@/constants/brand'

function mask(value: string): string {
  if (!value) return '—'
  if (value.length <= 8) return `${value.slice(0, 2)}••••`
  return `${value.slice(0, 6)}••••${value.slice(-4)}`
}

const DEPLOY_COMMANDS = [
  'npm run build',
  'firebase deploy --only firestore:rules,firestore:indexes',
  'firebase deploy --only hosting',
]

function CopyRow({ command }: { command: string }) {
  const { pushToast } = useToast()
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-line bg-black/25 px-3 py-2">
      <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-neon">{command}</code>
      <button
        type="button"
        aria-label={`Copy command: ${command}`}
        className="glass flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition hover:text-ink press"
        onClick={async () => {
          const ok = await copyText(command)
          setCopied(ok)
          if (ok) window.setTimeout(() => setCopied(false), 1600)
          else pushToast('error', 'Copy failed', 'Your browser blocked clipboard access — select the text manually.')
        }}
      >
        {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      </button>
    </div>
  )
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <span className={`text-right text-[13px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

export default function AdminSettingsPage() {
  useSeo({ title: 'Admin · Settings — NxK Greetings', noindex: true })
  const { profile, signOut, isDemoMode } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <AdminLayout
      title="Platform settings"
      subtitle="Backend status, product limits, privacy notes and the deploy checklist for this instance."
    >
      <div className="space-y-5">
        {/* Backend status */}
        <GlassCard className="rounded-3xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
              <ServerCog className="size-4 text-brand-soft" aria-hidden="true" />
              Backend status
            </h2>
            <Badge tone={isFirebaseConfigured ? 'green' : 'amber'}>
              {isFirebaseConfigured ? 'Firebase live' : 'Demo Mode — local only'}
            </Badge>
          </div>

          {isDemoMode && (
            <p className="mt-3 flex items-start gap-2 rounded-2xl border border-gold/25 bg-gold/8 px-4 py-3 text-[13px] leading-relaxed text-ink-dim">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
              <span>
                No Firebase credentials are configured, so greetings live only in this browser and every admin
                tool that needs Firestore (users, reports, moderation, analytics) reports an error instead of
                inventing data. Add the <code className="font-mono text-gold">VITE_FIREBASE_*</code> variables from{' '}
                <code className="font-mono text-gold">.env.example</code> and rebuild to switch on cloud mode.
              </span>
            </p>
          )}

          <div className="mt-4">
            <Row label="Project ID" value={firebaseEnv?.projectId ?? 'not configured'} />
            <Row label="Auth domain" value={firebaseEnv?.authDomain ?? 'not configured'} />
            <Row label="App ID" value={firebaseEnv ? mask(firebaseEnv.appId) : 'not configured'} />
            <Row label="API key" value={firebaseEnv ? mask(firebaseEnv.apiKey) : 'not configured'} />
            <Row label="Public app URL" value={getAppUrl() || 'current origin'} mono={false} />
            <Row label="Services in use" value="Authentication · Cloud Firestore · Hosting" mono={false} />
            <Row label="Firebase Storage" value="Not used in v1 (never imported)" mono={false} />
            <Row label="Build" value={`${BRAND.app} v${BRAND.version}`} mono={false} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Keys are masked here on purpose. Firebase web API keys are public identifiers — real protection comes
            from <code className="font-mono text-brand-soft">firestore.rules</code>, not from hiding them.
          </p>
        </GlassCard>

        {/* Admin access */}
        <GlassCard className="rounded-3xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <ShieldCheck className="size-4 text-neon" aria-hidden="true" />
            Admin access
          </h2>
          <div className="mt-3 text-sm leading-relaxed text-muted">
            <Row label="Your role" value={profile?.role ?? 'unknown'} />
            <Row label="Your UID" value={profile?.uid ? `${profile.uid.slice(0, 12)}…` : '—'} />
          </div>
          <ol className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink-dim">
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">1.</span>
              Roles live in Firestore at <code className="font-mono text-brand-soft">users/{'{uid}'}.role</code> —
              set the first admin from the Firebase console (the client can never promote itself).
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">2.</span>
              Additional admins are granted from the{' '}
              <Link to="/admin/users" className="font-semibold text-brand-soft underline decoration-brand/40 underline-offset-2 hover:text-ink">
                Users page
              </Link>{' '}
              — that write is itself guarded by a rules check that only an existing admin passes.
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">3.</span>
              Revoking a role takes effect on that user&apos;s next profile read (page refresh), and the UI guard
              redirects them out of <code className="font-mono text-brand-soft">/admin</code> immediately.
            </li>
          </ol>
          <div className="mt-4">
            <Button to="/admin/users" variant="secondary" size="sm">
              Manage admins & users
            </Button>
          </div>
        </GlassCard>

        {/* Limits */}
        <GlassCard className="rounded-3xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Gauge className="size-4 text-accent-soft" aria-hidden="true" />
            Product limits & rate limits
          </h2>
          <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
            <div>
              <Row label="Recipient name" value={`${LIMITS.recipientName.min}–${LIMITS.recipientName.max} chars`} />
              <Row label="Sender name" value={`0–${LIMITS.senderName.max} chars`} />
              <Row label="Message" value={`${LIMITS.message.min}–${LIMITS.message.max} chars`} />
              <Row label="Password" value={`${LIMITS.password.min}–${LIMITS.password.max} chars`} />
              <Row label="Report details" value={`0–${LIMITS.reportDetails.max} chars`} />
              <Row label="Greeting ID" value={`${GREETING_ID_LENGTH} chars, base62`} />
            </div>
            <div>
              <Row label="Min. gap between creates" value={`${RATE_LIMITS.minGenerateIntervalMs / 1000}s`} />
              <Row label="Max creates / 24h / browser" value={`${RATE_LIMITS.maxGenerationsPerDay}`} />
              <Row label="Min. gap between reports" value={`${RATE_LIMITS.minReportIntervalMs / 1000}s`} />
              <Row label="Max password attempts" value={`${RATE_LIMITS.maxPasswordAttempts} / session`} />
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            These are typed compile-time constants in{' '}
            <code className="font-mono text-brand-soft">src/constants/limits.ts</code> — the same values are
            enforced by <code className="font-mono text-brand-soft">firestore.rules</code> so a tampered client
            cannot write longer fields. Rate limits are browser-side: on the ₹0 Spark plan there is no Cloud
            Functions tier, so this is documented best-effort abuse friction rather than a hard server guarantee.
          </p>
        </GlassCard>

        {/* Privacy / data */}
        <GlassCard className="rounded-3xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Database className="size-4 text-success" aria-hidden="true" />
            Data & privacy
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            <li className="flex gap-2">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-gold" aria-hidden="true" />
              <span>
                <strong className="text-ink-dim">Passwords:</strong> optional greeting passwords are stretched with
                PBKDF2-SHA256 (150k iterations) plus a per-greeting salt in the browser; only the hash and salt are
                stored. Trade-off worth knowing: the check runs client-side, so it stops casual snoopers and shared
                links — it is not a substitute for server-side auth on truly sensitive content.
              </span>
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-neon" aria-hidden="true" />
              <span>
                <strong className="text-ink-dim">Reporter identities</strong> are stored on the report document and
                readable by admins only; the public report form never reveals them.
              </span>
            </li>
            <li className="flex gap-2">
              <Database className="mt-0.5 size-3.5 shrink-0 text-brand-soft" aria-hidden="true" />
              <span>
                <strong className="text-ink-dim">Deletion is real:</strong> creator delete and admin delete remove the
                greeting document immediately — no soft-delete archive, no third-party backup service.
              </span>
            </li>
            <li className="flex gap-2">
              <Gauge className="mt-0.5 size-3.5 shrink-0 text-accent-soft" aria-hidden="true" />
              <span>
                <strong className="text-ink-dim">No trackers:</strong> analytics come from your own Firestore
                documents. No cookies, no pixels, no ad SDKs.
              </span>
            </li>
          </ul>
        </GlassCard>

        {/* Deploy checklist */}
        <GlassCard className="rounded-3xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Rocket className="size-4 text-gold" aria-hidden="true" />
            Deploy checklist
          </h2>
          <ol className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">1.</span>
              Copy <code className="font-mono text-brand-soft">.env.example</code> to{' '}
              <code className="font-mono text-brand-soft">.env.local</code> and fill in your Firebase web app values.
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">2.</span>
              Enable Email/Password <em>and</em> Anonymous sign-in providers in Firebase Auth.
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">3.</span>
              Create Cloud Firestore (production mode), then deploy rules + indexes.
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">4.</span>
              Add your Hosting domain to the Auth “Authorized domains” list.
            </li>
            <li>
              <span className="mr-1.5 font-mono text-brand-soft">5.</span>
              Set <code className="font-mono text-brand-soft">role: &quot;admin&quot;</code> on your own{' '}
              <code className="font-mono text-brand-soft">users/{'{uid}'}</code> document from the console.
            </li>
          </ol>
          <div className="mt-4 space-y-2">
            {DEPLOY_COMMANDS.map((c) => (
              <CopyRow key={c} command={c} />
            ))}
          </div>
        </GlassCard>

        {/* Session */}
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5 sm:p-6">
          <div>
            <h2 className="font-display text-base font-bold text-ink">Your session</h2>
            <p className="mt-1 text-[13px] text-muted">
              Signed in as {profile?.displayName || profile?.email || 'admin'} · role {profile?.role ?? '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button to="/dashboard" variant="ghost" size="sm">
              Creator dashboard
            </Button>
            <Button variant="danger" size="sm" loading={signingOut} icon={<LogOut className="size-3.5" />} onClick={() => void handleSignOut()}>
              Sign out
            </Button>
          </div>
        </GlassCard>

        <p className="pb-2 text-center text-xs text-muted">
          {BRAND.app} · {BRAND.name} · Founder — {BRAND.founder} · Co-Founder — {BRAND.coFounder}
        </p>
      </div>
    </AdminLayout>
  )
}
