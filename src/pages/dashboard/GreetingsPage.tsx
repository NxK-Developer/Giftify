import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sparkles, SlidersHorizontal } from 'lucide-react'
import type { Greeting, OccasionId } from '@/types'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GreetingCard from '@/components/dashboard/GreetingCard'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import { Select } from '@/components/common/Input'
import { useMyGreetings } from '@/hooks/useMyGreetings'
import { useNow } from '@/hooks/useNow'
import { useCreator } from '@/store/CreatorContext'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { OCCASIONS } from '@/constants/occasions'
import { deleteGreeting, duplicateGreeting, promoteDemoGreeting } from '@/services/greetingService'
import { isFirebaseConfigured } from '@/lib/env'

type SortKey = 'newest' | 'oldest' | 'views' | 'name'

export default function GreetingsPage() {
  useSeo({
    title: 'My Greetings — NxK Greetings',
    description: 'Search, filter, sort and manage all your cinematic greetings.',
    canonicalPath: '/dashboard/greetings',
    noindex: true,
  })
  const { greetings, error, reload, loading, owner } = useMyGreetings()
  const { loadGreetingForEdit } = useCreator()
  const { session } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [occasionFilter, setOccasionFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const clockNow = useNow(15_000)

  const filtered = useMemo(() => {
    let list = [...(greetings ?? [])]
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (g) =>
          g.recipientName.toLowerCase().includes(q) ||
          g.senderName.toLowerCase().includes(q) ||
          g.nickname.toLowerCase().includes(q) ||
          g.message.toLowerCase().includes(q) ||
          g.id.toLowerCase().includes(q),
      )
    }
    if (occasionFilter) list = list.filter((g) => g.occasion === (occasionFilter as OccasionId))
    if (statusFilter) {
      const now = clockNow
      list = list.filter((g) => {
        if (statusFilter === 'active')
          return (
            g.status === 'active' &&
            (!g.scheduledAt || new Date(g.scheduledAt).getTime() <= now) &&
            (!g.expiresAt || new Date(g.expiresAt).getTime() > now)
          )
        if (statusFilter === 'scheduled')
          return Boolean(g.scheduledAt && new Date(g.scheduledAt).getTime() > now)
        if (statusFilter === 'expired') return Boolean(g.expiresAt && new Date(g.expiresAt).getTime() <= now)
        if (statusFilter === 'disabled') return g.status === 'disabled'
        if (statusFilter === 'private') return g.privacy === 'private'
        return true
      })
    }
    switch (sort) {
      case 'oldest':
        list.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
        break
      case 'views':
        list.sort((a, b) => b.views - a.views)
        break
      case 'name':
        list.sort((a, b) => a.recipientName.localeCompare(b.recipientName))
        break
      default:
        list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    }
    return list
  }, [greetings, search, occasionFilter, statusFilter, sort, clockNow])

  const handleEdit = (g: Greeting) => {
    loadGreetingForEdit(g)
    navigate('/personalize')
  }

  const handleDuplicate = async (g: Greeting) => {
    if (!owner) return
    try {
      const result = await duplicateGreeting(g, owner)
      pushToast('success', 'Duplicated ✨', 'A fresh editable copy is ready.')
      navigate('/share', {
        state: {
          result,
          snapshot: { ...g, id: result.id, views: 0, shares: 0, createdAt: new Date().toISOString() },
        },
      })
    } catch {
      pushToast('error', 'Duplicate failed', 'Please try again in a moment.')
    }
  }

  const handleDelete = async (g: Greeting) => {
    if (!owner) return
    try {
      await deleteGreeting(g.id, owner)
      pushToast('success', 'Greeting deleted', `The link for ${g.recipientName} no longer works.`)
      reload()
    } catch {
      pushToast('error', 'Delete failed', 'Please try again in a moment.')
    }
  }

  const handlePromote = async (g: Greeting) => {
    if (!owner || !isFirebaseConfigured) return
    setPromotingId(g.id)
    try {
      await promoteDemoGreeting(g, owner)
      pushToast('success', 'Saved to cloud ☁️', 'This greeting now works on any device.')
      reload()
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
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">My Greetings</h1>
          <p className="mt-1 text-sm text-muted">
            {greetings ? `${greetings.length} greeting${greetings.length === 1 ? '' : 's'} in your collection` : 'Loading…'}
          </p>
        </div>
        <Button to="/create" icon={<Sparkles className="size-4" />}>New greeting</Button>
      </div>

      {/* Toolbar */}
      <div className="glass-card mt-6 rounded-3xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex min-h-12 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden="true" />
            <span className="sr-only">Search greetings</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, message or id…"
              className="min-h-12 w-full rounded-2xl border border-line bg-white/4 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 transition focus:border-brand-soft/70 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Select
              label=""
              aria-label="Filter by occasion"
              value={occasionFilter}
              onChange={(e) => setOccasionFilter(e.target.value)}
              placeholder="All occasions"
              options={OCCASIONS.map((o) => ({ value: o.id, label: `${o.emoji} ${o.name}` }))}
              className="lg:w-44"
            />
            <Select
              label=""
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="All statuses"
              options={[
                { value: 'active', label: '🟢 Active' },
                { value: 'scheduled', label: '⏰ Scheduled' },
                { value: 'expired', label: '🥀 Expired' },
                { value: 'disabled', label: '🚫 Disabled' },
                { value: 'private', label: '🔒 Private' },
              ]}
              className="lg:w-40"
            />
            <Select
              label=""
              aria-label="Sort greetings"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              options={[
                { value: 'newest', label: '↓ Newest first' },
                { value: 'oldest', label: '↑ Oldest first' },
                { value: 'views', label: '👀 Most viewed' },
                { value: 'name', label: 'A→Z Recipient' },
              ]}
              className="lg:w-44"
            />
          </div>
        </div>
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-muted">
          <SlidersHorizontal className="size-3" aria-hidden="true" />
          {filtered.length} shown
          {(search || occasionFilter || statusFilter) && (
            <button
              type="button"
              className="font-semibold text-brand-soft hover:text-accent-soft"
              onClick={() => {
                setSearch('')
                setOccasionFilter('')
                setStatusFilter('')
              }}
            >
              · clear filters
            </button>
          )}
        </p>
      </div>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <LoadingScreen fullscreen={false} label="Loading your greetings…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={greetings && greetings.length > 0 ? '🔍' : '🎁'}
            title={greetings && greetings.length > 0 ? 'No matches' : 'No greetings yet'}
            message={
              greetings && greetings.length > 0
                ? 'Nothing matches those filters. Try clearing the search or picking a different status.'
                : 'Create your first cinematic surprise — it takes about two minutes.'
            }
            action={
              greetings && greetings.length > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch('')
                    setOccasionFilter('')
                    setStatusFilter('')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button to="/create" icon={<Sparkles className="size-4" />}>
                  Create a greeting
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger">
            {filtered.map((g) => (
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
      </div>
    </DashboardLayout>
  )
}
