import { useEffect, useState } from 'react'

/**
 * useNow — a ticking clock for countdowns / expiry badges.
 *
 * Returns `0` until the first tick lands (one frame after mount) so the
 * render stays pure: `Date.now()` is only read inside timer callbacks, and
 * the state updates happen asynchronously (never synchronously in an effect).
 * Consumers treat `0` as "not measured yet" and render a neutral placeholder.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0)

  useEffect(() => {
    const first = window.setTimeout(() => setNow(Date.now()), 0)
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [intervalMs])

  return now
}
