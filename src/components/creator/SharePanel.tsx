import { useState } from 'react'
import { Link2, Check, Share2, MessageCircle } from 'lucide-react'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import {
  canNativeShare,
  copyText,
  nativeShare,
  platformShareLinks,
  shareText,
} from '@/services/shareService'
import type { Greeting } from '@/types'
import { useToast } from '@/store/ToastContext'
import { cn } from '@/utils/cn'

export interface SharePanelProps {
  greeting: Pick<Greeting, 'id' | 'recipientName' | 'occasion' | 'senderName'>
  url: string
  /** Called after any successful share action (analytics) */
  onShared?: () => void
}

const PLATFORMS: {
  key: keyof ReturnType<typeof platformShareLinks>
  label: string
  emoji: string
}[] = [
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { key: 'x', label: 'X / Twitter', emoji: '🐦' },
  { key: 'facebook', label: 'Facebook', emoji: '📘' },
  { key: 'telegram', label: 'Telegram', emoji: '✈️' },
  { key: 'email', label: 'Email', emoji: '📧' },
]

/**
 * Honest sharing: native Web Share API where available, documented intent
 * URLs elsewhere, Copy Link as the universal fallback. No platform is ever
 * claimed to support something it doesn't.
 */
export default function SharePanel({ greeting, url, onShared }: SharePanelProps) {
  const { pushToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const text = shareText(greeting)
  const links = platformShareLinks(url, text)
  const nativeAvailable = canNativeShare(url, text)

  const handleCopy = async () => {
    const ok = await copyText(url)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
      pushToast('success', 'Link copied ✨', 'Paste it anywhere — it opens the full cinematic experience.')
      onShared?.()
    } else {
      pushToast('error', 'Couldn’t copy', 'Your browser blocked clipboard access. Long-press the link to copy it manually.')
    }
  }

  const handleNativeShare = async () => {
    setSharing(true)
    const outcome = await nativeShare(url, text, `A surprise for ${greeting.recipientName} ✨`)
    setSharing(false)
    if (outcome === 'shared') onShared?.()
    if (outcome === 'failed' || outcome === 'unavailable') {
      pushToast('info', 'Share sheet unavailable', 'Use Copy Link or a platform button below instead.')
    }
  }

  return (
    <GlassCard className="p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
        <Share2 className="size-4 text-accent-soft" aria-hidden="true" />
        Send the surprise
      </h3>

      {/* URL box */}
      <div className="mt-3.5 flex items-stretch gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-black/30 px-3.5">
          <Link2 className="size-4 shrink-0 text-brand-soft" aria-hidden="true" />
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Greeting link"
            className="min-w-0 flex-1 bg-transparent py-3 font-mono text-[12.5px] text-ink-dim focus:outline-none"
          />
        </div>
        <Button
          variant={copied ? 'gold' : 'secondary'}
          onClick={handleCopy}
          className="shrink-0 px-4"
          aria-label={copied ? 'Copied' : 'Copy link'}
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : 'Copy'}
        </Button>
      </div>

      {/* Native share */}
      {nativeAvailable && (
        <Button className="mt-3 w-full" onClick={handleNativeShare} loading={sharing} icon={<Share2 className="size-4" />}>
          Share via…
        </Button>
      )}

      {/* Platform intents */}
      <div className="mt-3.5 grid grid-cols-5 gap-2">
        {PLATFORMS.map((p) => (
          <a
            key={p.key}
            href={links[p.key]}
            target={p.key === 'email' ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={() => window.setTimeout(() => onShared?.(), 400)}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-white/3 p-2 text-center transition hover:-translate-y-0.5 hover:border-brand-soft/40 hover:bg-white/6 press',
            )}
            aria-label={`Share on ${p.label}`}
            title={p.key === 'whatsapp' ? 'Opens WhatsApp with your link ready to send' : `Opens ${p.label} with your link`}
          >
            <span className="text-lg" aria-hidden="true">{p.emoji}</span>
            <span className="text-[9.5px] font-semibold leading-tight text-muted">{p.label}</span>
          </a>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
        <MessageCircle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
        Platform buttons open that app/site with your link pre-filled — the final send always happens there.
        {nativeAvailable ? ' “Share via…” uses your device’s native share sheet.' : ' This browser has no native share sheet, so Copy Link is your fastest option.'}
      </p>
    </GlassCard>
  )
}
