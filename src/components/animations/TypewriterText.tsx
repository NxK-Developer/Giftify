import { useEffect, useRef, useState } from 'react'
import { Typewriter } from '@/animations/Typewriter'
import { useSettings } from '@/store/SettingsContext'
import { cn } from '@/utils/cn'

export interface TypewriterTextProps {
  text: string
  /** ms per character */
  speed?: number
  /** Delay before typing starts (ms) */
  startDelay?: number
  start?: boolean
  /** Freeze typing in place (exact resume — progress is never lost) */
  paused?: boolean
  onComplete?: () => void
  showCursor?: boolean
  className?: string
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3'
}

/**
 * Typewriter reveal used across the recipient experience. The full text is
 * exposed via aria-label so screen readers get everything immediately;
 * reduced-motion users see the text instantly (no character animation).
 */
export default function TypewriterText({
  text,
  speed = 28,
  startDelay = 0,
  start = true,
  paused = false,
  onComplete,
  showCursor = true,
  className,
  as: Tag = 'p',
}: TypewriterTextProps) {
  const { reducedMotion } = useSettings()
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)
  const twRef = useRef<Typewriter | null>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // Reduced motion: the text is simply there — derived, never animated.
  const visibleText = reducedMotion ? text : shown
  const finished = reducedMotion || done

  // Fire onComplete once for reduced-motion users (async, timer-driven).
  useEffect(() => {
    if (!start || !reducedMotion) return
    const t = window.setTimeout(() => onCompleteRef.current?.(), 60)
    return () => window.clearTimeout(t)
  }, [start, reducedMotion, text])

  useEffect(() => {
    if (!start || reducedMotion) return
    let tw: Typewriter | null = null
    const kickoff = window.setTimeout(() => {
      tw = new Typewriter({
        text,
        msPerChar: speed,
        reducedMotion: false,
        onText: setShown,
        onComplete: () => {
          setDone(true)
          onCompleteRef.current?.()
        },
      })
      twRef.current = tw
      tw.start()
    }, startDelay)
    return () => {
      window.clearTimeout(kickoff)
      tw?.destroy()
      twRef.current = null
    }
    // `text`/`speed` intentionally re-create the typewriter; start gates it.
  }, [text, speed, startDelay, start, reducedMotion])

  // Pause/resume without losing progress
  useEffect(() => {
    const tw = twRef.current
    if (!tw) return
    if (paused) tw.pause()
    else tw.resume()
  }, [paused])

  return (
    <Tag aria-label={text} className={cn(className)}>
      <span aria-hidden="true">
        {visibleText}
        {showCursor && !finished && (
          <span className="terminal-caret" aria-hidden="true" />
        )}
      </span>
    </Tag>
  )
}
