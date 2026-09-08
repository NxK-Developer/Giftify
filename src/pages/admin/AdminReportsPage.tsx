import { useCallback, useEffect, useState } from 'react'
import { Flag, CheckCheck, XCircle, Ban, Trash2, ExternalLink } from 'lucide-react'
import type { Report, ReportStatus } from '@/types'
import AdminLayout from '@/components/admin/AdminLayout'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import EmptyState from '@/components/common/EmptyState'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'
import { listReports, setReportStatus, setGreetingStatus, adminDeleteGreeting } from '@/services/adminService'
import { REPORT_REASONS } from '@/services/reportService'
import { relativeTime, formatDateTime } from '@/utils/format'

const STATUS_TABS: { id: ReportStatus | 'all'; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'reviewed', label: 'Reviewed' },
  { id: 'dismissed', label: 'Dismissed' },
  { id: 'all', label: 'All' },
]

const REASON_TONES: Record<Report['reason'], 'red' | 'amber' | 'pink' | 'violet' | 'neutral'> = {
  spam: 'amber',
  harassment: 'red',
  inappropriate: 'pink',
  abuse: 'red',
  other: 'neutral',
}

export default function AdminReportsPage() {
  useSeo({ title: 'Admin · Reports — NxK Greetings', noindex: true })
  const { pushToast } = useToast()
  const [tab, setTab] = useState<ReportStatus | 'all'>('pending')
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    listReports(tab === 'all' ? undefined : tab, 200)
      .then((next) => {
        setReports(next)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reports.'))
      .finally(() => setRefreshing(false))
  }, [tab])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const act = async (r: Report, action: 'reviewed' | 'dismissed' | 'disable-greeting') => {
    setBusyId(r.id)
    try {
      if (action === 'disable-greeting') {
        await setGreetingStatus(r.greetingId, 'disabled')
        await setReportStatus(r.id, 'reviewed')
        pushToast('success', 'Greeting disabled', `/g/${r.greetingId} is offline and the report is marked reviewed.`)
      } else {
        await setReportStatus(r.id, action)
        pushToast('success', action === 'reviewed' ? 'Marked reviewed' : 'Report dismissed')
      }
      setReloadKey((k) => k + 1)
    } catch (err) {
      pushToast('error', 'Action failed', err instanceof Error ? err.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  const deleteGreeting = async (r: Report) => {
    setBusyId(r.id)
    try {
      await adminDeleteGreeting(r.greetingId)
      await setReportStatus(r.id, 'reviewed')
      pushToast('success', 'Greeting deleted', `/g/${r.greetingId} was removed permanently.`)
      setDeleteTarget(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      pushToast('error', 'Delete failed', err instanceof Error ? err.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  const reasonLabel = (id: Report['reason']) =>
    REPORT_REASONS.find((r) => r.id === id)?.label ?? id

  return (
    <AdminLayout
      title="Reports"
      subtitle="Abuse reports from recipients. Reporter identities are visible only here — never publicly."
    >
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Report status">
        {STATUS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setRefreshing(true)
              setTab(t.id)
            }}
            className={`min-h-10 rounded-full border px-4 text-[13px] font-semibold transition press ${
              tab === t.id
                ? 'border-brand-soft/60 bg-brand/15 text-ink shadow-[0_0_18px_rgba(139,92,246,0.3)]'
                : 'border-line bg-white/3 text-muted hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={() => {
            setError(null)
            setRefreshing(true)
            setReloadKey((k) => k + 1)
          }} />
        ) : !reports ? (
          <LoadingScreen fullscreen={false} label="Loading reports…" />
        ) : reports.length === 0 ? (
          <EmptyState icon="🛡️" title={tab === 'pending' ? 'No pending reports' : 'Nothing here'} message={tab === 'pending' ? 'The community is behaving — or nobody has reported anything yet.' : 'No reports with this status.'} />
        ) : (
          <ul aria-busy={refreshing} className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="glass-card rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Flag className="size-4 text-danger" aria-hidden="true" />
                      <Badge tone={REASON_TONES[r.reason] ?? 'neutral'}>{reasonLabel(r.reason)}</Badge>
                      <Badge
                        tone={r.status === 'pending' ? 'amber' : r.status === 'reviewed' ? 'green' : 'neutral'}
                      >
                        {r.status}
                      </Badge>
                      <span className="font-mono text-[11px] text-brand-soft">/g/{r.greetingId}</span>
                    </div>
                    {r.details && <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-ink-dim">“{r.details}”</p>}
                    <p className="mt-2 text-[11px] text-muted" title={formatDateTime(r.createdAt)}>
                      Reported {relativeTime(r.createdAt)} · reporter: {r.reporterUid ? `${r.reporterUid.slice(0, 10)}… (private)` : 'anonymous'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <a href={`/g/${r.greetingId}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" icon={<ExternalLink className="size-3.5" />}>
                        View
                      </Button>
                    </a>
                    {r.status === 'pending' && (
                      <>
                        <Button
                          variant="gold"
                          size="sm"
                          loading={busyId === r.id}
                          icon={<Ban className="size-3.5" />}
                          onClick={() => act(r, 'disable-greeting')}
                        >
                          Disable greeting
                        </Button>
                        <Button variant="secondary" size="sm" icon={<CheckCheck className="size-3.5" />} onClick={() => act(r, 'reviewed')} disabled={busyId === r.id}>
                          Reviewed
                        </Button>
                        <Button variant="ghost" size="sm" icon={<XCircle className="size-3.5" />} onClick={() => act(r, 'dismissed')} disabled={busyId === r.id}>
                          Dismiss
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" className="hover:text-danger" icon={<Trash2 className="size-3.5" />} onClick={() => setDeleteTarget(r)}>
                      Delete greeting
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete the reported greeting?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" loading={busyId === deleteTarget?.id} onClick={() => deleteTarget && deleteGreeting(deleteTarget)}>
              Delete & mark reviewed
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          /g/{deleteTarget?.greetingId} will be permanently removed and the report marked reviewed. Prefer
          “Disable greeting” when you might need the content later as evidence.
        </p>
      </Modal>
    </AdminLayout>
  )
}
