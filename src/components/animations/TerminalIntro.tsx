import { useEffect, useRef, useState } from 'react'
import { SkipForward } from 'lucide-react'
import { CodeReveal, type CodeRevealState } from '@/animations/CodeReveal'
import { TERMINAL_LINES } from '@/constants/animations'
import { useSettings } from '@/store/SettingsContext'
import { cn } from '@/utils/cn'

export interface TerminalIntroProps {
  lines?: string[]
  onComplete: () => void
  paused?: boolean
  accentClass?: string
}

/**
 * TerminalIntro — the cinematic code intro.
 * A dark CRT-style terminal types pre-written lines ("initializing
 * surprise...", …, "access granted") over matrix rain. This is a pure
 * visual effect: nothing here touches networks or systems, and the UI says
 * so honestly in the skip affordance. Reduced motion collapses typing.
 */
export default function TerminalIntro({
  lines = TERMINAL_LINES,
  onComplete,
  paused = false,
  accentClass = 'text-matrix',
}: TerminalIntroProps) {
  const { reducedMotion } = useSettings()
  const [state, setState] = useState<CodeRevealState>({
    lines: [],
    finished: false,
    progress: 0,
  })
  const revealRef = useRef<CodeReveal | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const reveal = new CodeReveal({
      lines,
      reducedMotion,
      msPerChar: 32,
      lineDelayMs: 380,
      onState: setState,
      onComplete: () => onCompleteRef.current(),
    })
    revealRef.current = reveal
    reveal.start()
    return () => {
      reveal.destroy()
      revealRef.current = null
    }
    // lines array identity: callers pass constants or stable props
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion])

  useEffect(() => {
    const reveal = revealRef.current
    if (!reveal) return
    if (paused) reveal.pause()
    else reveal.resume()
  }, [paused])

  return (
    <div className="scanlines relative flex size-full flex-col justify-center overflow-hidden px-5 sm:px-10">
      {/* subtle top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(74,222,128,0.12),transparent)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-xl font-mono text-[13px] leading-relaxed sm:text-sm">
        <p className={cn('mb-4 text-[11px] uppercase tracking-[0.3em] opacity-60', accentClass)}>
          nxxk::surprise --init
        </p>
        <div className="space-y-2" aria-live="polite" aria-label="Cinematic loading sequence">
          {state.lines.map((line, i) => (
            <p key={line.text} className="flex items-baseline gap-2">
              <span className={cn('shrink-0 opacity-55', accentClass)}>{'>'}</span>
              <span
                className={cn(
                  line.kind === 'granted'
                    ? cn(accentClass, 'text-base font-bold tracking-[0.22em] uppercase text-glow sm:text-lg')
                    : 'text-ink-dim',
                  !line.done && i === state.lines.findIndex((l) => !l.done) && 'terminal-caret',
                )}
              >
                {line.kind === 'granted' && line.typed > 0 ? line.text.slice(0, line.typed) : line.text.slice(0, line.typed)}
              </span>
            </p>
          ))}
        </div>

        {/* progress hairline */}
        <div className="mt-8 h-px w-full bg-white/8">
          <div
            className={cn('h-px bg-current transition-[width] duration-300', accentClass)}
            style={{ width: `${Math.round(state.progress * 100)}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => revealRef.current?.skip()}
        className="glass absolute bottom-6 right-5 z-20 flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-ink-dim transition hover:text-ink press"
        aria-label="Skip the cinematic intro"
      >
        <SkipForward className="size-3.5" aria-hidden="true" />
        Skip intro
      </button>
    </div>
  )
}
