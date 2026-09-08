import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { PartyPopper, ExternalLink, Plus, LayoutDashboard, FlaskConical } from 'lucide-react'
import type { CreateGreetingResult, Greeting } from '@/types'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import EmptyState from '@/components/common/EmptyState'
import LoadingScreen from '@/components/common/LoadingScreen'
import SharePanel from '@/components/creator/SharePanel'
import QRCodePanel from '@/components/creator/QRCodePanel'
import { ConfettiAnimation } from '@/animations/ConfettiAnimation'
import { THEME_MAP, getTheme } from '@/constants/themes'
import { getOccasion } from '@/constants/occasions'
import { fetchGreeting } from '@/services/greetingService'
import { recordShare } from '@/services/analyticsService'
import { useSettings } from '@/store/SettingsContext'
import { useSeo } from '@/hooks/useSeo'
import { formatDateTime } from '@/utils/format'

interface ShareLocationState {
  result?: CreateGreetingResult
  snapshot?: Greeting
}

/** One-shot celebratory confetti header — local canvas, respects settings. */
function ConfettiHeader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { tier, reducedMotion } = useSettings()
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new ConfettiAnimation(canvas, { tier, reducedMotion }, {
      theme: THEME_MAP.celebration,
      ambient: false,
    })
    engine.mount()
    engine.start()
    requestAnimationFrame(() => {
      engine.celebrate(reducedMotion ? 18 : 64)
      window.setTimeout(() => engine.celebrate(reducedMotion ? 10 : 40), 700)
    })
    return () => engine.destroy()
  }, [tier, reducedMotion])
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
}

/**
 * /share — "Your surprise is ready! 🎉"
 * Reads the fresh result from router state, or re-resolves a greeting via
 * ?id= when revisited from the dashboard.
 */
export default function SharePage() {
  useSeo({
    title: 'Your surprise is ready! 🎉 — NxK Greetings',
    description: 'Copy the link, grab the QR code, or share it straight to WhatsApp — your cinematic greeting is ready.',
    canonicalPath: '/share',
    noindex: true,
  })
  const location = useLocation()
  const [params] = useSearchParams()
  const state = (location.state as ShareLocationState | null) ?? null

  const [fetched, setFetched] = useState<Greeting | null>(null)
  const [fetchDone, setFetchDone] = useState(false)
  const queryId = params.get('id')
  const needsFetch = !state?.snapshot && Boolean(queryId)
  const done = fetchDone || !needsFetch

  useEffect(() => {
    if (!needsFetch || !queryId) return
    let alive = true
    void fetchGreeting(queryId).then((r) => {
      if (!alive) return
      if ((r.state === 'ok' || r.state === 'password-required') && r.greeting) setFetched(r.greeting)
      setFetchDone(true)
    })
    return () => {
      alive = false
    }
  }, [queryId, needsFetch])

  const greeting = state?.snapshot ?? fetched
  const result = state?.result
  const url = useMemo(() => {
    if (result?.url) return result.url
    if (greeting) return `${window.location.origin}/g/${greeting.id}`
    return null
  }, [result, greeting])

  if (!done) {
    return <LoadingScreen label="Fetching your greeting…" />
  }

  if (!greeting || !url) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24">
        <EmptyState
          icon={<PartyPopper className="size-7 text-brand-soft" />}
          title="Nothing to share yet"
          message="Once you generate a greeting, its link, QR code and share options appear here. You can also share any greeting later from your dashboard."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button to="/create">Create a greeting</Button>
              <Button to="/dashboard" variant="secondary">
                Open dashboard
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  const occasion = getOccasion(greeting.occasion)
  const theme = getTheme(greeting.theme)
  const isDemo = Boolean(result?.isDemo ?? greeting.isDemo)

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-80">
        <ConfettiHeader />
      </div>
      <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-20 pt-14 sm:pt-20">
        <div className="text-center">
          <p className="text-4xl animate-float" aria-hidden="true">🎉</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-[2.6rem]">
            Your surprise is <span className="text-gradient">ready!</span>
          </h1>
          <p className="mt-2.5 text-[15px] text-muted">
            For <strong className="text-ink">{greeting.recipientName}</strong> · {occasion.emoji} {occasion.name} ·{' '}
            {theme.emoji} {theme.name}
          </p>
          <p className="mt-1 font-mono text-[11px] tracking-widest text-muted/70 uppercase">
            greeting id · /g/{greeting.id}
          </p>
        </div>

        {isDemo && (
          <GlassCard className="mt-7 border-gold/25 p-4">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gold/90">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong className="font-bold">Demo Mode:</strong> this greeting is saved on this device only —
                the link opens here, not on other phones. Connect Firebase (see README) to make links shareable
                everywhere. Nothing was silently “uploaded”.
              </span>
            </p>
          </GlassCard>
        )}

        <div className="mt-7 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <SharePanel
              greeting={greeting}
              url={url}
              onShared={() => void recordShare(greeting)}
            />
            <GlassCard className="p-5">
              <h3 className="font-display text-sm font-bold text-ink">Greeting summary</h3>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                <dt className="text-muted">Privacy</dt>
                <dd className="text-right font-semibold capitalize text-ink-dim">{greeting.privacy}</dd>
                <dt className="text-muted">Music</dt>
                <dd className="text-right font-semibold capitalize text-ink-dim">{greeting.music}</dd>
                <dt className="text-muted">Animation</dt>
                <dd className="text-right font-semibold text-ink-dim">{greeting.animation}</dd>
                {greeting.scheduledAt && (
                  <>
                    <dt className="text-muted">Unlocks</dt>
                    <dd className="text-right font-semibold text-ink-dim">{formatDateTime(greeting.scheduledAt)}</dd>
                  </>
                )}
                {greeting.expiresAt && (
                  <>
                    <dt className="text-muted">Expires</dt>
                    <dd className="text-right font-semibold text-ink-dim">{formatDateTime(greeting.expiresAt)}</dd>
                  </>
                )}
                {greeting.passwordHash && (
                  <>
                    <dt className="text-muted">Password</dt>
                    <dd className="text-right font-semibold text-ink-dim">🔒 Locked</dd>
                  </>
                )}
              </dl>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <a
                  href={`/g/${greeting.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-line-strong bg-white/5 text-sm font-semibold text-ink transition hover:bg-white/10"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open greeting
                </a>
                <Button to="/dashboard/greetings" variant="ghost" size="md" className="flex-1" icon={<LayoutDashboard className="size-4" />}>
                  Dashboard
                </Button>
              </div>
            </GlassCard>
          </div>

          <QRCodePanel url={url} filename={`nxxk-${greeting.id}-qr`} />
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-soft transition hover:text-accent-soft"
          >
            <Plus className="size-4" aria-hidden="true" />
            Make another surprise
          </Link>
        </div>
      </main>
    </div>
  )
}
