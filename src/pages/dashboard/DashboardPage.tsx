import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gift, Eye, Share2, Target, Sparkles, ArrowRight, CloudUpload } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GreetingCard from '@/components/dashboard/GreetingCard'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useMyGreetings } from '@/hooks/useMyGreetings'
import { useCreator } from '@/store/CreatorContext'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { useCountUp } from '@/hooks/useCountUp'
import { completionRate, getCreatorStats } from '@/services/analyticsService'
import { deleteGreeting, duplicateGreeting, promoteDemoGreeting } from '@/services/greetingService'
import { isFirebaseConfigured } from '@/lib/env'
import { formatNumber } from '@/utils/format'

function StatCard({
  icon,
  label,
  value,
  suffix,
  title,
}: {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  title?: string
}) {
  const animated = useCountUp(value)
  return (
    <GlassCard className="p-5" {...(title ? { title } : {})}>
      <div className="flex items-center gap-2.5 text-muted">
        <span className="flex size-9 items-center justify-center rounded-xl border border-line bg-white/4 text-brand-soft" aria-hidden="true">
          {icon}
        </span>
        <span className="text-[11.5px] font-bold tracking-[0.14em] uppercase">{label}</span>
      </div>
      <p className="mt-3.5 font-display text-3xl font-extrabold tracking-tight text-ink tabular-nums">
        {formatNumber(animated)}
        {suffix && <span className="ml-0.5 text-lg text-muted">{suffix}</span>}
      </p>
    </GlassCard>
  )
}

export default function DashboardPage() {
  useSeo({
    title: 'Dashboard — NxK Greetings',
    description: 'Your greetings, views, shares and completion rate.',
    canonicalPath: '/dashboard',
    noindex: true,
  })
  const { greetings, error, reload, loading, owner } = useMyGreetings()
  const { loadGreetingForEdit } = useCreator()
  const { session } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const totals = useMemo(() => {
    const list = greetings ?? []
    return {
      greetings: list.length,
      views: list.reduce((s, g) => s + g.views, 0),
      shares: list.reduce((s, g) => s + g.shares, 0),
    }
  }, [greetings])

  const rate = completionRate()
  const stats = getCreatorStats()
  const recent = (greetings ?? []).slice(0, 4)

  const handleEdit = (g: (typeof recent)[number]) => {
    loadGreetingForEdit(g)
    navigate('/personalize')
  }

  const handleDuplicate = async (g: (typeof recent)[number]) => {
    if (!owner) return
    try {
      const result = await duplicateGreeting(g, owner)
      pushToast('success', 'Duplicated ✨', 'A fresh editable copy is ready to share.')
      navigate('/share', { state: { result, snapshot: { ...g, id: result.id, views: 0, shares: 0, createdAt: new Date().toISOString() } } })
    } catch {
      pushToast('error', 'Duplicate failed', 'Please try again in a moment.')
    }
  }

  const handleDelete = async (g: (typeof recent)[number]) => {
    if (!owner) return
    try {
      await deleteGreeting(g.id, owner)
      pushToast('success', 'Greeting deleted', `The link for ${g.recipientName} no longer works.`)
      reload()
    } catch {
      pushToast('error', 'Delete failed', 'Please try again in a moment.')
    }
  }

  const handlePromote = async (g: (typeof recent)[number]) => {
    if (!owner || !isFirebaseConfigured) return
    setPromotingId(g.id)
    try {
      const result = await promoteDemoGreeting(g, owner)
      pushToast('success', 'Saved to cloud ☁️', 'This greeting now works on any device.')
      reload()
      void result
    } catch {
      pushToast('error', 'Cloud save failed', 'Check your connection and try again.')
    } finally {
      setPromotingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Hey, {session?.displayName ?? (session?.isAnonymous ? 'Guest creator' : 'Creator')} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">Here’s how your surprises are doing.</p>
        </div>
        <Button to="/create" icon={<Sparkles className="size-4" />}>
          New greeting
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard icon={<Gift className="size-4.5" />} label="Greetings" value={totals.greetings} />
        <StatCard icon={<Eye className="size-4.5" />} label="Total views" value={totals.views} />
        <StatCard icon={<Share2 className="size-4.5" />} label="Total shares" value={totals.shares} />
        <StatCard
          icon={<Target className="size-4.5" />}
          label="Completion"
          value={rate}
          suffix="%"
          title={`Drafts started on this device: ${stats.draftsStarted} · Completed greetings: ${stats.greetingsCompleted}. A local, honest metric — not a server-side funnel.`}
        />
      </div>

      {/* Anonymous upgrade nudge */}
      {session?.isAnonymous && isFirebaseConfigured && (
        <GlassCard className="mt-4 flex flex-col items-start gap-3 border-neon/20 p-4 sm:flex-row sm:items-center">
          <CloudUpload className="size-5 shrink-0 text-neon" aria-hidden="true" />
          <p className="flex-1 text-[13px] leading-relaxed text-muted">
            You’re browsing as a <strong className="text-ink-dim">guest</strong>. Create a free account in one
            tap — your uid stays the same, so every guest greeting carries over automatically.
          </p>
          <Button to="/signup" size="sm" variant="secondary" className="shrink-0">
            Secure my data
          </Button>
        </GlassCard>
      )}

      {/* Recent greetings */}
      <section className="mt-8" aria-label="Recent greetings">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">Recent greetings</h2>
          {(greetings?.length ?? 0) > 4 && (
            <Link to="/dashboard/greetings" className="group flex items-center gap-1 text-xs font-semibold text-brand-soft transition hover:text-accent-soft">
              View all <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {loading ? (
          <LoadingScreen fullscreen={false} label="Loading your greetings…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon="🎁"
            title="No greetings yet"
            message="Your first cinematic surprise is about two minutes away. Pick an occasion and let the wizard handle the rest."
            action={<Button to="/create" icon={<Sparkles className="size-4" />}>Create your first greeting</Button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {recent.map((g) => (
              <GreetingCard
                key={g.id}
                greeting={g}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onShare={(gg) => navigate(`/share?id=${gg.id}`)}
                onPromote={g.isDemo && isFirebaseConfigured && !!session ? handlePromote : undefined}
                promoting={promotingId === g.id}
              />
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}
