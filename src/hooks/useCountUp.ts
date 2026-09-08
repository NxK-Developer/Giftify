import { useEffect, useRef, useState } from 'react'
import { useSettings } from '@/store/SettingsContext'

/** Animated number counter for dashboard stats. Reduced motion → instant. */
export function useCountUp(target: number, durationMs = 900): number {
  const { reducedMotion } = useSettings()
  const [value, setValue] = useState(reducedMotion ? target : 0)
  const raf = useRef(0)

  useEffect(() => {
    if (reducedMotion) return
    const start = performance.now()
    const from = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, durationMs, reducedMotion])

  return reducedMotion ? target : value
}
