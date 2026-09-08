import { useState } from 'react'
import { ExternalLink, PenLine, CopyPlus, Share2, QrCode, Trash2, Eye, CalendarClock, Lock } from 'lucide-react'
import type { Greeting } from '@/types'
import Badge from '@/components/common/Badge'
import { useNow } from '@/hooks/useNow'
import Modal from '@/components/common/Modal'
import Button from '@/components/common/Button'
import QRCodePanel from '@/components/creator/QRCodePanel'
import { getOccasion } from '@/constants/occasions'
import { getTheme } from '@/constants/themes'
import { buildGreetingUrl } from '@/services/greetingService'
import { formatDateTime, relativeTime } from '@/utils/format'
import { cn } from '@/utils/cn'

export interface GreetingCardProps {
  greeting: Greeting
  onEdit: (g: Greeting) => void
  onDuplicate: (g: Greeting) => void
  onDelete: (g: Greeting) => void
  onShare: (g: Greeting) => void
  /** Shown when a local/demo greeting can be copied to the cloud */
  onPromote?: (g: Greeting) => void
  promoting?: boolean
}

function statusBadges(g: Greeting, now: number) {
  const badges: React.ReactNode[] = []
  if (g.isDemo) badges.push(<Badge key="demo" tone="amber">Demo · on-device</Badge>)
  if (g.status === 'disabled') badges.push(<Badge key="disabled" tone="red">Disabled</Badge>)
  else if (g.scheduledAt && new Date(g.scheduledAt).getTime() > now)
    badges.push(<Badge key="sched" tone="cyan">Scheduled</Badge>)
  else if (g.expiresAt && new Date(g.expiresAt).getTime() < now)
    badges.push(<Badge key="exp" tone="neutral">Expired</Badge>)
  else badges.push(<Badge key="active" tone="green">Active</Badge>)
  if (g.privacy === 'private') badges.push(<Badge key="priv" tone="violet">Private</Badge>)
  if (g.passwordHash) badges.push(<Badge key="pw" tone="pink">🔒 Locked</Badge>)
  return badges
}

export default function GreetingCard({ greeting, onEdit, onDuplicate, onDelete, onShare, onPromote, promoting }: GreetingCardProps) {
  const now = useNow(30_000)
  const [qrOpen, setQrOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const occasion = getOccasion(greeting.occasion)
  const theme = getTheme(greeting.theme)
  const url = buildGreetingUrl(greeting.id)

  const iconBtn =
    'flex min-h-10 min-w-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white/3 px-2 text-[11.5px] font-semibold text-muted transition hover:border-brand-soft/40 hover:bg-white/7 hover:text-ink press sm:flex-none sm:px-3.5'

  return (
    <>
      <article className="glass-card group overflow-hidden rounded-3xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-24px_rgba(139,92,246,0.45)]">
        {/* theme strip */}
        <div
          aria-hidden="true"
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${theme.background[2]}, ${theme.accent}, ${theme.accent2})` }}
        />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                style={{
                  background: `linear-gradient(135deg, ${occasion.gradient[0]}28, ${occasion.gradient[1]}18)`,
                  border: `1px solid ${occasion.gradient[0]}40`,
                }}
                aria-hidden="true"
              >
                {occasion.emoji}
              </span>
              <div className="min-w-0">
                <h3 className="truncate font-display text-[15px] font-bold text-ink">
                  For {greeting.recipientName}
                  {greeting.nickname.trim() && <span className="text-muted"> “{greeting.nickname.trim()}”</span>}
                </h3>
                <p className="mt-0.5 truncate text-[11.5px] text-muted">
                  {occasion.name} · {theme.emoji} {theme.name} ·{' '}
                  <span title={formatDateTime(greeting.createdAt)}>{relativeTime(greeting.createdAt)}</span>
                </p>
              </div>
            </div>
            <a
              href={`/g/${greeting.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white/3 text-muted transition hover:border-brand-soft/40 hover:text-ink"
              aria-label={`Open greeting for ${greeting.recipientName} in a new tab`}
              title="Open"
            >
              <ExternalLink className="size-4" />
            </a>
          </div>

          <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-dim/85">{greeting.message}</p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {statusBadges(greeting, now)}
            {onPromote && (
              <button
                type="button"
                onClick={() => onPromote(greeting)}
                disabled={promoting}
                className="rounded-full border border-neon/35 bg-neon/10 px-2.5 py-0.5 text-[11px] font-bold text-neon transition hover:bg-neon/18 disabled:opacity-50 press"
              >
                {promoting ? 'Saving…' : '☁️ Save to Cloud'}
              </button>
            )}
            <span className="ml-auto flex items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1" title="Views">
                <Eye className="size-3.5" aria-hidden="true" /> {greeting.views}
              </span>
              <span className="flex items-center gap-1" title="Shares">
                <Share2 className="size-3.5" aria-hidden="true" /> {greeting.shares}
              </span>
              {greeting.expiresAt && (
                <span className="flex items-center gap-1" title={`Expires ${formatDateTime(greeting.expiresAt)}`}>
                  <CalendarClock className="size-3.5" aria-hidden="true" />
                </span>
              )}
              {greeting.privacy === 'private' && (
                <span title="Private — only people with the password link can open" className="flex items-center">
                  <Lock className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4">
            <a href={`/g/${greeting.id}`} target="_blank" rel="noopener noreferrer" className={iconBtn}>
              <ExternalLink className="size-3.5" aria-hidden="true" /> Open
            </a>
            <button type="button" className={iconBtn} onClick={() => onEdit(greeting)} aria-label={`Edit greeting for ${greeting.recipientName}`}>
              <PenLine className="size-3.5" aria-hidden="true" /> Edit
            </button>
            <button type="button" className={iconBtn} onClick={() => onDuplicate(greeting)} aria-label={`Duplicate greeting for ${greeting.recipientName}`}>
              <CopyPlus className="size-3.5" aria-hidden="true" /> Duplicate
            </button>
            <button type="button" className={iconBtn} onClick={() => onShare(greeting)} aria-label={`Share greeting for ${greeting.recipientName}`}>
              <Share2 className="size-3.5" aria-hidden="true" /> Share
            </button>
            <button type="button" className={iconBtn} onClick={() => setQrOpen(true)} aria-label={`QR code for greeting to ${greeting.recipientName}`}>
              <QrCode className="size-3.5" aria-hidden="true" /> QR
            </button>
            <button
              type="button"
              className={cn(iconBtn, 'hover:border-danger/40 hover:text-danger')}
              onClick={() => setConfirmDelete(true)}
              aria-label={`Delete greeting for ${greeting.recipientName}`}
            >
              <Trash2 className="size-3.5" aria-hidden="true" /> Delete
            </button>
          </div>
        </div>
      </article>

      {/* QR modal */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`QR for ${greeting.recipientName}’s greeting`} size="sm">
        <QRCodePanel url={url} filename={`nxxk-${greeting.id}-qr`} />
        <p className="mt-3 text-center text-[11px] text-muted">
          Print it, stick it on a card, or show it on your phone — scanning opens the cinematic experience.
        </p>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this greeting?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              onClick={async () => {
                setDeleting(true)
                try {
                  await onDelete(greeting)
                } catch {
                  /* page-level handler surfaces the toast */
                } finally {
                  setDeleting(false)
                  setConfirmDelete(false)
                }
              }}
            >
              Delete forever
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          The greeting for <strong className="text-ink">{greeting.recipientName}</strong> will stop working
          immediately — the link will show “this link doesn’t lead anywhere”. This can’t be undone.
        </p>
      </Modal>
    </>
  )
}
