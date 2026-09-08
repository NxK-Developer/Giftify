import type { Greeting, TemplateConfig, ThemeConfig } from '@/types'
import TypewriterText from '@/components/animations/TypewriterText'
import { BRAND, CREDIT_LINES } from '@/constants/brand'
import { getOccasion } from '@/constants/occasions'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'

/**
 * Stage overlays for the recipient experience. Pure presentation —
 * the orchestrator (RecipientExperience) owns timing, engines and music.
 * All text renders through React (escaped by default); the full text is
 * always exposed for screen readers even while typewriter effects run.
 */

const messageFont = (theme: ThemeConfig, greeting: Greeting, template?: TemplateConfig) =>
  template?.scriptStyle || (theme.fontTone === 'script' && greeting.occasion !== 'sorry')
    ? 'font-script text-2xl leading-relaxed sm:text-3xl'
    : theme.fontTone === 'mono'
      ? 'font-mono text-base leading-relaxed sm:text-lg'
      : 'font-body text-[17px] leading-relaxed sm:text-xl'

/* ------------------------------------------------------------------ */

export function NameOverlay({ greeting, theme }: { greeting: Greeting; theme: ThemeConfig }) {
  const displayName = greeting.nickname.trim() || greeting.recipientName
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end pb-[16vh] px-6 text-center">
      <h2
        className="animate-blur-in font-display text-4xl font-extrabold tracking-tight text-white text-glow sm:text-6xl"
        style={{ textShadow: `0 0 34px ${theme.glow}, 0 0 90px ${theme.glow}` }}
      >
        Hey, {displayName}{' '}
        <span className="inline-block animate-heartbeat" aria-hidden="true">
          ❤️
        </span>
      </h2>
      <p className="mt-5 animate-fade-up text-sm text-white/75 sm:text-base" style={{ animationDelay: '1.1s' }}>
        Someone created something special for you…
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function MessageOverlay({
  greeting,
  theme,
  template,
  paused,
  onTyped,
}: {
  greeting: Greeting
  theme: ThemeConfig
  template?: TemplateConfig
  paused: boolean
  onTyped: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-xl animate-fade-in">
        <span
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-black/25 text-2xl backdrop-blur"
          aria-hidden="true"
        >
          {getOccasion(greeting.occasion).emoji}
        </span>
        <div
          className={cn(
            'mx-auto max-h-[46vh] overflow-y-auto rounded-3xl border border-white/10 bg-black/30 px-6 py-7 text-white/92 backdrop-blur-md sm:px-9',
            messageFont(theme, greeting, template),
          )}
        >
          <TypewriterText
            text={greeting.message}
            speed={30}
            paused={paused}
            onComplete={onTyped}
            as="p"
            className="whitespace-pre-line"
          />
        </div>
        {greeting.senderName.trim() && (
          <p className="mt-5 animate-fade-up text-xs font-semibold tracking-[0.18em] text-white/55 uppercase" style={{ animationDelay: '0.4s' }}>
            — with love, {greeting.senderName}
          </p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function FlourishOverlay({
  greeting,
  theme,
  template,
}: {
  greeting: Greeting
  theme: ThemeConfig
  template?: TemplateConfig
}) {
  const headline = template?.defaultText.headline
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
      {headline && (
        <h2
          className="animate-scale-in font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl"
          style={{ textShadow: `0 0 30px ${theme.glow}` }}
        >
          {headline}
        </h2>
      )}
      <p className="mt-4 animate-fade-up text-sm text-white/70" style={{ animationDelay: '0.5s' }}>
        {greeting.nickname.trim() || greeting.recipientName}, this moment is yours ✨
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function FinalScene({
  greeting,
  theme,
  template,
  onReplay,
  onShare,
  shareUrl,
  canShareNatively,
  preview,
}: {
  greeting: Greeting
  theme: ThemeConfig
  template?: TemplateConfig
  onReplay: () => void
  onShare: () => void
  shareUrl: string | null
  canShareNatively: boolean
  preview: boolean
}) {
  const displayName = greeting.nickname.trim() || greeting.recipientName
  const occasion = getOccasion(greeting.occasion)
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center overflow-y-auto px-5 pb-28 pt-[12vh] text-center sm:pb-32">
      <p className="animate-fade-up text-[11px] font-bold tracking-[0.35em] text-white/60 uppercase">
        ✨ Made Just For You ✨
      </p>

      <h2
        className="mt-3 animate-blur-in font-display text-3xl font-extrabold tracking-tight text-white text-glow sm:text-5xl"
        style={{ textShadow: `0 0 34px ${theme.glow}` }}
      >
        {displayName} <span className="inline-block animate-heartbeat" aria-hidden="true">❤️</span>
      </h2>

      <div
        className={cn(
          'mt-6 w-full max-w-lg animate-fade-up rounded-3xl border border-white/12 bg-black/35 px-6 py-7 text-white/90 backdrop-blur-md sm:px-8',
          messageFont(theme, greeting, template),
        )}
        style={{ animationDelay: '0.25s' }}
      >
        <p className="whitespace-pre-line">{greeting.message}</p>
      </div>

      <div className="mt-5 flex animate-fade-up flex-wrap items-center justify-center gap-2 text-[11px]" style={{ animationDelay: '0.4s' }}>
        <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-semibold text-white/75 backdrop-blur">
          {occasion.emoji} {occasion.name}
        </span>
        {greeting.specialDate && (
          <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-semibold text-white/75 backdrop-blur">
            📅 {formatDate(greeting.specialDate)}
          </span>
        )}
        {greeting.senderName.trim() && (
          <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 font-semibold text-white/75 backdrop-blur">
            💌 from {greeting.senderName}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex w-full max-w-lg animate-fade-up flex-col gap-2.5 sm:flex-row sm:justify-center" style={{ animationDelay: '0.55s' }}>
        <button
          type="button"
          onClick={onReplay}
          className="press min-h-12 flex-1 rounded-2xl border border-white/15 bg-white/8 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14 sm:flex-none"
        >
          ↺ Replay
        </button>
        {!preview && shareUrl && (
          <button
            type="button"
            onClick={onShare}
            className="press min-h-12 flex-1 rounded-2xl bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] px-6 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(236,72,153,0.6)] transition hover:brightness-110 sm:flex-none"
          >
            {canShareNatively ? '📤 Share' : '🔗 Copy link'}
          </button>
        )}
        {!preview && (
          <a
            href="/create"
            className="press min-h-12 flex-1 rounded-2xl border border-white/15 bg-white/8 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/14 sm:flex-none"
          >
            ✨ Create Your Own
          </a>
        )}
      </div>

      {/* NxK credits — subtle, classy, exactly as specified */}
      <div className="mt-10 animate-fade-in text-center" style={{ animationDelay: '0.8s' }}>
        <div className="mx-auto mb-3 h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />
        {CREDIT_LINES.map((line) => (
          <p key={line} className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">
            {line.includes(BRAND.name) ? (
              <>
                Created with <span className="text-white/70">{BRAND.name}</span>
              </>
            ) : (
              line
            )}
          </p>
        ))}
      </div>
    </div>
  )
}
