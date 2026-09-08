import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Gift, Flag, Eye, Share2, ArrowRight } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import GlassCard from '@/components/common/GlassCard'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useSeo } from '@/hooks/useSeo'
import { getAdminOverview, type AdminOverview } from '@/services/adminService'
import { formatNumber } from '@/utils/format'

const TILES: {
  key: keyof AdminOverview
  label: string
  icon: typeof Users
  to: string
  tone: string
}[] = [
  { key: 'users', label: 'Users', icon: Users, to: '/admin/users', tone: 'text-brand-soft border-brand/25 bg-brand/10' },
  { key: 'greetings', label: 'Greetings', icon: Gift, to: '/admin/greetings', tone: 'text-accent-soft border-accent/25 bg-accent/10' },
  { key: 'pendingReports', label: 'Pending reports', icon: Flag, to: '/admin/reports', tone: 'text-danger border-danger/25 bg-danger/10' },
  { key: 'totalViews', label: 'Views (last 500)', icon: Eye, to: '/admin/analytics', tone: 'text-neon border-neon/25 bg-neon/10' },
  { key: 'totalShares', label: 'Shares (last 500)', icon: Share2, to: '/admin/analytics', tone: 'text-gold border-gold/25 bg-gold/10' },
]

export default function AdminOverviewPage() {
  useSeo({ title: 'Admin Overview — NxK Greetings', noindex: true })
  const [data, setData] = useState<AdminOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    getAdminOverview()
      .then((next) => {
        setData(next)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load overview.'))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  return (
    <AdminLayout title="Overview" subtitle="Live counts from Firestore (aggregations are bounded — see the note below).">
      {error ? (
        <ErrorState message={error} onRetry={() => {
            setError(null)
            setRefreshing(true)
            setReloadKey((k) => k + 1)
          }} />
      ) : !data ? (
        <LoadingScreen fullscreen={false} label="Reading Firestore aggregates…" />
      ) : (
        <>
          <div aria-busy={refreshing} className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
            {TILES.map((t) => (
              <Link key={t.key} to={t.to} className="group">
                <GlassCard className="h-full p-5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-white/20">
                  <span className={`flex size-9 items-center justify-center rounded-xl border ${t.tone}`} aria-hidden="true">
                    <t.icon className="size-4.5" />
                  </span>
                  <p className="mt-3.5 font-display text-2xl font-extrabold text-ink tabular-nums">
                    {formatNumber(data[t.key])}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-muted">
                    {t.label}
                    <ArrowRight className="size-3 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                  </p>
                </GlassCard>
              </Link>
            ))}
          </div>

          <GlassCard className="mt-5 p-5">
            <h2 className="font-display text-sm font-bold text-ink">How these numbers are computed</h2>
            <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-muted">
              <li>• Users, greetings and pending reports use Firestore count aggregations (cheap server-side reads).</li>
              <li>• Views/shares sum the 500 most recent greeting documents — an honest, bounded read cost on the free plan.</li>
              <li>• Nothing on this page is simulated; if Firestore is unreachable you’ll see the real error with retry.</li>
            </ul>
          </GlassCard>
        </>
      )}
    </AdminLayout>
  )
}
