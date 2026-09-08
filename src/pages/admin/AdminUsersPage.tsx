import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, ShieldOff } from 'lucide-react'
import type { UserProfile } from '@/types'
import AdminLayout from '@/components/admin/AdminLayout'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import EmptyState from '@/components/common/EmptyState'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'
import { useAuth } from '@/store/AuthContext'
import { listUsers, adminSetUserRole } from '@/services/adminService'
import { formatDate } from '@/utils/format'

export default function AdminUsersPage() {
  useSeo({ title: 'Admin · Users — NxK Greetings', noindex: true })
  const { session } = useAuth()
  const { pushToast } = useToast()
  const [users, setUsers] = useState<UserProfile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [roleTarget, setRoleTarget] = useState<{ user: UserProfile; next: 'admin' | 'user' } | null>(null)
  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(() => {
    listUsers(300)
      .then((next) => {
        setUsers(next)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users.'))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q || !users) return users ?? []
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q),
    )
  }, [users, search])

  const applyRole = async () => {
    if (!roleTarget) return
    setBusy(true)
    try {
      await adminSetUserRole(roleTarget.user.uid, roleTarget.next)
      pushToast('success', 'Role updated', `${roleTarget.user.email ?? roleTarget.user.uid} is now ${roleTarget.next}.`)
      setRoleTarget(null)
      setReloadKey((k) => k + 1)
    } catch (err) {
      pushToast('error', 'Update failed', err instanceof Error ? err.message : 'Firestore rejected the change.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Users" subtitle="Profiles from users/{uid}. Role changes are rule-enforced: only admins can write the role field.">
      <label className="relative flex min-h-12 max-w-md items-center">
        <Search className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden="true" />
        <span className="sr-only">Search users</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name or uid…"
          className="min-h-12 w-full rounded-2xl border border-line bg-white/4 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 focus:border-brand-soft/70 focus:outline-none"
        />
      </label>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={() => {
            setError(null)
            setRefreshing(true)
            setReloadKey((k) => k + 1)
          }} />
        ) : !users ? (
          <LoadingScreen fullscreen={false} label="Loading users…" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="👤" title="No users found" message="Nobody matches that search yet." />
        ) : (
          <div aria-busy={refreshing} className="glass-card overflow-x-auto rounded-3xl">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Greetings</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.uid} className="border-b border-line/60 transition last:border-0 hover:bg-white/3">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-ink">{u.displayName ?? <span className="text-muted">No name</span>}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">
                        {u.email ?? 'anonymous'} · {u.uid.slice(0, 10)}…
                        {u.uid === session?.uid && <span className="ml-1.5 text-brand-soft">(you)</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.role === 'admin' ? <Badge tone="violet">admin</Badge> : <Badge tone="neutral">user</Badge>}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-ink-dim">{u.greetingCount}</td>
                    <td className="px-4 py-3.5 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      {u.uid === session?.uid ? (
                        <span className="text-[11px] text-muted">—</span>
                      ) : u.role === 'admin' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ShieldOff className="size-3.5" />}
                          onClick={() => setRoleTarget({ user: u, next: 'user' })}
                        >
                          Revoke admin
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ShieldCheck className="size-3.5" />}
                          onClick={() => setRoleTarget({ user: u, next: 'admin' })}
                        >
                          Make admin
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={roleTarget !== null}
        onClose={() => setRoleTarget(null)}
        title={roleTarget?.next === 'admin' ? 'Grant admin role?' : 'Revoke admin role?'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRoleTarget(null)} disabled={busy}>Cancel</Button>
            <Button variant={roleTarget?.next === 'admin' ? 'primary' : 'danger'} loading={busy} onClick={applyRole}>
              {roleTarget?.next === 'admin' ? 'Grant admin' : 'Revoke admin'}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          {roleTarget?.next === 'admin'
            ? `This gives ${roleTarget?.user.email ?? roleTarget?.user.uid} full moderation powers: reading all greetings, disabling content and managing reports. Only do this for people you trust completely.`
            : `${roleTarget?.user.email ?? roleTarget?.user.uid} will immediately lose admin access. Firestore rules enforce this on every request.`}
        </p>
      </Modal>
    </AdminLayout>
  )
}
