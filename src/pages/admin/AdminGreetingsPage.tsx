import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Ban, CheckCircle2, Trash2, ExternalLink } from 'lucide-react'
import AdminLayout from '@/components/admin/AdminLayout'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import EmptyState from '@/components/common/EmptyState'
import { Select } from '@/components/common/Input'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'
import {
  listGreetingsAdmin,
  setGreetingStatus,
  adminDeleteGreeting,
  type AdminGreetingRow,
} from '@/services/adminService'
import { getOccasion } from '@/constants/occasions'
import { getTheme } from '@/constants/themes'
import { formatDateTime, relativeTime } from '@/utils/format'

export default function AdminGreetingsPage() {
  useSeo({ title: 'Admin · Greetings — NxK Greetings', noindex: true })
  const { pushToast } = useToast()
  const [rows, setRows] = useState<AdminGreetingRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detail, setDetail] = useState<AdminGreetingRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminGreetingRow | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    listGreetingsAdmin(300)
      .then((next) => {
        setRows(next)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load greetings.'))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const filtered = useMemo(() => {
    let list = rows ?? []
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (g) =>
          g.recipientName.toLowerCase().includes(q) ||
          g.senderName.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q) ||
          (g.ownerEmail ?? '').toLowerCase().includes(q),
      )
    }
    if (statusFilter) list = list.filter((g) => g.status === statusFilter)
    return list
  }, [rows, search, statusFilter])

  const toggleStatus = async (g: AdminGreetingRow) => {
    const next = g.status === 'disabled' ? 'active' : 'disabled'
    setBusyId(g.id)
    try {
      await setGreetingStatus(g.id, next)
      pushToast('success', next === 'disabled' ? 'Greeting disabled' : 'Greeting re-enabled', `/${g.id} is now ${next}.`)
      setReloadKey((k) => k + 1)
      setDetail((d) => (d && d.id === g.id ? { ...d, status: next } : d))
    } catch (err) {
      pushToast('error', 'Action failed', err instanceof Error ? err.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (g: AdminGreetingRow) => {
    setBusyId(g.id)
    try {
      await adminDeleteGreeting(g.id)
      pushToast('success', 'Greeting deleted', `/${g.id} no longer exists.`)
      setConfirmDelete(null)
      setDetail(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      pushToast('error', 'Delete failed', err instanceof Error ? err.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout
      title="Greetings"
      subtitle="Every greeting document, newest first (bounded to 300). Disable abusive content or delete it permanently."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex min-h-12 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden="true" />
          <span className="sr-only">Search greetings</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recipient, sender, id or owner email…"
            className="min-h-12 w-full rounded-2xl border border-line bg-white/4 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 focus:border-brand-soft/70 focus:outline-none"
          />
        </label>
        <Select
          label=""
          aria-label="Filter by status"
          className="sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="All statuses"
          options={[
            { value: 'active', label: '🟢 Active' },
            { value: 'disabled', label: '🚫 Disabled' },
          ]}
        />
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={() => {
            setError(null)
            setRefreshing(true)
            setReloadKey((k) => k + 1)
          }} />
        ) : !rows ? (
          <LoadingScreen fullscreen={false} label="Loading greetings…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="🗂️" title="No greetings found" message="Nothing matches those filters — or nobody has created one yet." />
        ) : (
          <div aria-busy={refreshing} className="glass-card overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 py-3.5">Greeting</th>
                  <th className="px-4 py-3.5">Owner</th>
                  <th className="px-4 py-3.5">Config</th>
                  <th className="px-4 py-3.5">Privacy</th>
                  <th className="px-4 py-3.5">Views</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Created</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const occasion = getOccasion(g.occasion)
                  return (
                    <tr key={g.id} className="border-b border-line/60 transition last:border-0 hover:bg-white/3">
                      <td className="px-4 py-3.5">
                        <button type="button" className="text-left press" onClick={() => setDetail(g)}>
                          <p className="font-semibold text-ink">
                            {occasion.emoji} {g.recipientName || '(no name)'}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-brand-soft">/g/{g.id}</p>
                        </button>
                      </td>
                      <td className="max-w-40 px-4 py-3.5">
                        <p className="truncate text-ink-dim">{g.ownerEmail ?? '—'}</p>
                        <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">{g.ownerId.slice(0, 12)}…</p>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {getTheme(g.theme).emoji} {g.theme} · {g.music}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={g.privacy === 'private' ? 'violet' : g.privacy === 'public' ? 'green' : 'neutral'}>
                          {g.privacy}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-ink-dim">{g.views}</td>
                      <td className="px-4 py-3.5">
                        {g.status === 'disabled' ? <Badge tone="red">disabled</Badge> : <Badge tone="green">active</Badge>}
                      </td>
                      <td className="px-4 py-3.5 text-muted" title={formatDateTime(g.createdAt)}>
                        {relativeTime(g.createdAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleStatus(g)}
                            disabled={busyId === g.id}
                            className={`flex size-9 items-center justify-center rounded-xl border border-line bg-white/3 transition disabled:opacity-50 press ${
                              g.status === 'disabled' ? 'hover:border-success/40 hover:text-success' : 'hover:border-gold/40 hover:text-gold'
                            } text-muted`}
                            aria-label={g.status === 'disabled' ? `Re-enable /g/${g.id}` : `Disable /g/${g.id}`}
                            title={g.status === 'disabled' ? 'Re-enable' : 'Disable'}
                          >
                            {g.status === 'disabled' ? <CheckCircle2 className="size-4" /> : <Ban className="size-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(g)}
                            className="flex size-9 items-center justify-center rounded-xl border border-line bg-white/3 text-muted transition hover:border-danger/40 hover:text-danger disabled:opacity-50 press"
                            aria-label={`Delete /g/${g.id}`}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail ? `Greeting /g/${detail.id}` : ''}
        size="lg"
        footer={
          detail && (
            <>
              <a href={`/g/${detail.id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" icon={<ExternalLink className="size-3.5" />}>
                  Open as recipient
                </Button>
              </a>
              <Button
                variant={detail.status === 'disabled' ? 'primary' : 'gold'}
                size="sm"
                loading={busyId === detail.id}
                onClick={() => toggleStatus(detail)}
                icon={detail.status === 'disabled' ? <CheckCircle2 className="size-3.5" /> : <Ban className="size-3.5" />}
              >
                {detail.status === 'disabled' ? 'Re-enable' : 'Disable'}
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 className="size-3.5" />} onClick={() => setConfirmDelete(detail)}>
                Delete
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-line bg-white/3 p-4">
              <p className="text-[11px] font-bold tracking-[0.18em] text-muted uppercase">Message</p>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-dim">{detail.message}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
              {[
                ['Recipient', detail.recipientName || '—'],
                ['Sender', detail.senderName || '—'],
                ['Nickname', detail.nickname || '—'],
                ['Relationship', detail.relationship || '—'],
                ['Occasion', getOccasion(detail.occasion).name],
                ['Template', detail.templateId || '—'],
                ['Theme', detail.theme],
                ['Animation', detail.animation],
                ['Music', detail.music],
                ['Privacy', detail.privacy],
                ['Status', detail.status],
                ['Views / Shares', `${detail.views} / ${detail.shares}`],
                ['Scheduled', detail.scheduledAt ? formatDateTime(detail.scheduledAt) : '—'],
                ['Expires', detail.expiresAt ? formatDateTime(detail.expiresAt) : 'Never'],
                ['Password lock', detail.passwordHash ? 'Yes (PBKDF2 hash)' : 'No'],
                ['Created', formatDateTime(detail.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-line/50 pb-1.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="max-w-[60%] truncate text-right font-semibold text-ink-dim" title={String(v)}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete greeting permanently?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={busyId !== null}>Cancel</Button>
            <Button variant="danger" loading={busyId === confirmDelete?.id} onClick={() => confirmDelete && remove(confirmDelete)}>
              Delete forever
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          {confirmDelete?.recipientName ? `The greeting for ${confirmDelete.recipientName} ` : 'This greeting '}
          will be removed from Firestore and its link will immediately stop working. Consider disabling instead
          if you may need the record for a report review.
        </p>
      </Modal>
    </AdminLayout>
  )
}
