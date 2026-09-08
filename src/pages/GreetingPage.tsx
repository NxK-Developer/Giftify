import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Greeting, GreetingFetchResult } from '@/types'
import { fetchGreeting } from '@/services/greetingService'
import { recordView, recordShare } from '@/services/analyticsService'
import { buildGreetingUrl, canNativeShare, copyText, nativeShare, shareText } from '@/services/shareService'
import LoadingScreen from '@/components/common/LoadingScreen'
import GreetingGate from '@/components/recipient/GreetingGate'
import RecipientExperience from '@/components/recipient/RecipientExperience'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'

/**
 * /g/:greetingId — the recipient's entry point.
 * Fetch + validate the greeting config, handle every non-happy path with a
 * polished gate, then render the full cinematic experience.
 */
export default function GreetingPage() {
  const { greetingId = '' } = useParams<{ greetingId: string }>()
  const { pushToast } = useToast()
  const [result, setResult] = useState<GreetingFetchResult | null>(null)
  const [unlockedGreeting, setUnlockedGreeting] = useState<Greeting | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let alive = true
    void fetchGreeting(greetingId).then((r) => {
      if (alive) setResult(r)
    })
    return () => {
      alive = false
    }
  }, [greetingId, reloadKey])

  const greeting = unlockedGreeting ?? (result?.state === 'ok' ? result.greeting : null) ?? null

  useSeo({
    title: greeting
      ? `A surprise for ${greeting.recipientName} ✨`
      : 'Your surprise is loading… ✨',
    description: 'Someone created a cinematic personalized greeting just for you. Open it, tap to begin.',
    noindex: true, // recipient links are private moments, not indexable pages
  })

  const handleStarted = useCallback(() => {
    if (greeting) void recordView(greeting)
  }, [greeting])

  const shareUrl = useMemo(() => (greeting ? buildGreetingUrl(greeting.id) : null), [greeting])

  const handleShare = useCallback(async () => {
    if (!greeting || !shareUrl) return
    const text = shareText(greeting)
    void recordShare(greeting)
    if (canNativeShare(shareUrl, text)) {
      const outcome = await nativeShare(shareUrl, text, `A surprise for ${greeting.recipientName} ✨`)
      if (outcome === 'failed') {
        const copied = await copyText(shareUrl)
        pushToast(copied ? 'success' : 'error', copied ? 'Link copied' : 'Share failed', copied ? 'Sharing sheet didn’t open, so we copied the link instead.' : 'Please copy the link manually.')
      }
      return
    }
    const copied = await copyText(shareUrl)
    pushToast(copied ? 'success' : 'error', copied ? 'Link copied ✨' : 'Copy failed', copied ? 'Paste it anywhere — WhatsApp, DMs, a sticky note.' : 'Your browser blocked clipboard access.')
  }, [greeting, shareUrl, pushToast])

  if (!result && !greeting) {
    return (
      <LoadingScreen
        label="Unlocking your surprise…"
        progressLines={['Unlocking your surprise…', 'Checking the stars…', 'Almost there…']}
      />
    )
  }

  if (greeting && shareUrl) {
    return (
      <RecipientExperience
        greeting={greeting}
        onStarted={handleStarted}
        onShare={handleShare}
        shareUrl={shareUrl}
        canShareNatively={canNativeShare(shareUrl, shareText(greeting))}
      />
    )
  }

  return (
    <GreetingGate
      result={result ?? { state: 'not-found' }}
      onUnlock={(g) => setUnlockedGreeting(g)}
      onRetry={() => {
        setResult(null)
        setUnlockedGreeting(null)
        setReloadKey((k) => k + 1)
      }}
    />
  )
}
