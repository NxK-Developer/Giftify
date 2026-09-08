import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, RefreshCw, Eye, CalendarDays, Sparkles, Palette, ShieldCheck } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import { useSeo } from '@/hooks/useSeo'
import { getAdminAnalytics, type AdminAnalytics } from '@/services/adminService'
import { OCCASION_MAP } from '@/constants/occasions'
import { THEME_MAP } from '@/constants/themes'
import { formatNumber, formatDate } from '@/utils/format'
import type { OccasionId, ThemeId } from '@/types'

const BAR_COLORS = ['#8b5cf6', '#ec4899', '#22d3ee', '#fbbf24', '#34d399', '#a78bfa']

function DistributionBar({
  label,
  sub,
  value,
  max,
  colorIndex,
}: {
  label: string
  sub?: string
  value: number
  max: number
  colorIndex: number
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  const color = BAR_COLORS[colorIndex % BAR_COLORS.length]
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[13px] font-semibold text-ink">{label}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
          {formatNumber(value)} · {pct}%
        </span>
      </div>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted">{sub}</p>}
      <div
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/6"
        role="img"
        aria-label={`${label}: ${value} (${pct}%)`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${Math.max(pct, value > 0 ? 3 : 0)}%`,
            backgroundImage: `linear-gradient(90deg, ${color}, ${color}99)`,
            boxShadow: `0 0 14px -4px ${color}`,
          }}
        />
      </div>
    </li>
  )
}

export default function AdminAnalyticsPage() {
  useSeo({ title: 'Admin · Analytics — NxK Greetings', noindex: true })
  const [data, setData] = useState<AdminAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    getAdminAnalytics()
      .then((next) => {
        setData(next)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics.'))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const maxDay = useMemo(() => (data ? Math.max(1, ...data.byDay.map((d) => d.count)) : 1), [data])
  const maxOccasion = useMemo(() => (data ? Math.max(1, ...data.byOccasion.map((d) => d.count)) : 1), [data])
  const maxTheme = useMemo(() => (data ? Math.max(1, ...data.byTheme.map((d) => d.count)) : 1), [data])
  const maxViews = useMemo(() => (data ? Math.max(1, ...data.topByViews.map((d) => d.views)) : 1), [data])

  const totals = useMemo(() => {
    if (!data) return { creations: 0, views: 0 }
    return {
      creations: data.byDay.reduce((s, d) => s + d.count, 0),
      views: data.topByViews.reduce((s, d) => s + d.views, 0),
    }
  }, [data])

  const refresh = () => {
    setRefreshing(true)
    load()
  }

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Aggregated straight from your own Firestore data — no third-party analytics SDK, no cookies, no ad networks."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="cyan">
          <ShieldCheck className="size-3" aria-hidden="true" /> Privacy-first: aggregate counts only
        </Badge>
        {data && <Badge tone="neutral">Sampled from {formatNumber(data.sampledCount)} most recent greetings</Badge>}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          icon={<RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          onClick={() => void refresh()}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-5">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      ) : !data ? (
        <div className="mt-5">
          <LoadingScreen fullscreen={false} label="Crunching numbers…" />
        </div>
      ) : data.sampledCount === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={<BarChart3 className="size-7 text-brand-soft" aria-hidden="true" />}
            title="No greetings yet"
            message="Charts appear as soon as the first greeting is published to Firestore. Go create one — it takes about a minute."
            action={<Button to="/create">Create a greeting</Button>}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {/* 30-day creations */}
          <GlassCard className="rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <CalendarDays className="size-4 text-neon" aria-hidden="true" />
                Creations · last 30 days
              </h2>
              <span className="font-mono text-xs text-muted">{formatNumber(totals.creations)} total</span>
            </div>
            <div className="mt-5 flex h-32 items-end gap-[3px]" role="img" aria-label={`Greetings created per day over the last 30 days, ${totals.creations} total`}>
              {data.byDay.map((d) => {
                const h = d.count > 0 ? Math.max(6, Math.round((d.count / maxDay) * 100)) : 2
                return (
                  <div key={d.day} className="group relative flex-1" title={`${formatDate(`${d.day}T12:00:00`)} — ${d.count}`}>
                    <div
                      className="w-full rounded-t-[3px] bg-[linear-gradient(180deg,#a78bfa,#6d28d9)] transition-all duration-500 group-hover:bg-[linear-gradient(180deg,#f472b6,#a855f7)]"
                      style={{ height: `${h}%`, minHeight: d.count > 0 ? 6 : 2 }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted">
              <span>{formatDate(`${data.byDay[0]?.day}T12:00:00`)}</span>
              <span>today</span>
            </div>
          </GlassCard>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Occasions */}
            <GlassCard className="rounded-3xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <Sparkles className="size-4 text-accent-soft" aria-hidden="true" />
                By occasion
              </h2>
              <ul className="mt-4 space-y-3.5">
                {data.byOccasion.map((o, i) => {
                  const occ = OCCASION_MAP[o.id as OccasionId]
                  return (
                    <DistributionBar
                      key={o.id}
                      label={occ ? `${occ.emoji} ${occ.name}` : o.id}
                      value={o.count}
                      max={maxOccasion}
                      colorIndex={i}
                    />
                  )
                })}
              </ul>
            </GlassCard>

            {/* Themes */}
            <GlassCard className="rounded-3xl p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <Palette className="size-4 text-brand-soft" aria-hidden="true" />
                By theme
              </h2>
              <ul className="mt-4 space-y-3.5">
                {data.byTheme.map((t, i) => {
                  const theme = THEME_MAP[t.id as ThemeId]
                  return (
                    <DistributionBar
                      key={t.id}
                      label={theme ? theme.name : t.id}
                      sub={theme?.description}
                      value={t.count}
                      max={maxTheme}
                      colorIndex={i + 2}
                    />
                  )
                })}
              </ul>
            </GlassCard>
          </div>

          {/* Top by views */}
          <GlassCard className="rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <Eye className="size-4 text-gold" aria-hidden="true" />
                Most viewed greetings
              </h2>
              <Link to="/admin/greetings" className="text-xs font-semibold text-brand-soft hover:text-ink">
                Manage greetings →
              </Link>
            </div>
            {data.topByViews.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No view data yet — views are counted once a recipient opens a link.</p>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {data.topByViews.map((g, i) => {
                  const pct = Math.round((g.views / maxViews) * 100)
                  return (
                    <li key={g.id} className="relative overflow-hidden rounded-2xl border border-line bg-white/3 px-4 py-3">
                      <div
                        className="pointer-events-none absolute inset-y-0 left-0 bg-brand/12"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                        aria-hidden="true"
                      />
                      <div className="relative flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-semibold text-ink">
                          <span className="mr-2 font-mono text-[11px] text-muted">#{i + 1}</span>
                          {g.recipientName || 'Unnamed recipient'}
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-brand-soft">/g/{g.id}</span>
                          <span className="font-mono text-xs tabular-nums text-gold">{formatNumber(g.views)} views</span>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </GlassCard>

          <GlassCard className="rounded-3xl p-5 text-xs leading-relaxed text-muted sm:p-6">
            <h2 className="mb-2 font-display text-sm font-bold text-ink">How these numbers are computed</h2>
            <p>
              To stay inside the Spark (₹0) plan, analytics never run a full-collection scan or a Cloud Function.
              This page reads the <strong className="text-ink-dim">{formatNumber(data.sampledCount)} most recent</strong>{' '}
              greeting documents once, then aggregates occasions, themes, per-day creations and views in the browser.
              View and share counters themselves are exact per-greeting values written with Firestore{' '}
              <code className="font-mono text-brand-soft">increment(1)</code> atomically, deduped per recipient session.
              If your collection grows past the sample window, the distributions still reflect your newest content —
              the totals on the Overview page are the authoritative lifetime counts.
            </p>
            <p className="mt-2">
              Views recorded here: {formatNumber(totals.views)} across the top {data.topByViews.length} greetings in the sample.
            </p>
          </GlassCard>
        </div>
      )}
    </AdminLayout>
  )
}
