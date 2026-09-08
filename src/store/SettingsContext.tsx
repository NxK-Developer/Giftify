import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PerfTier } from '@/types'
import { detectPerfTier, tierFromFps } from '@/animations/perf'
import { STORAGE_KEYS } from '@/constants/limits'
import { readJSON, writeJSON } from '@/utils/storage'

/**
 * SettingsContext — user-controllable experience settings:
 *  - performance mode (auto/high/medium/low) with runtime FPS refinement
 *  - reduced motion (system preference + manual override)
 *  - default music volume
 * Persisted to localStorage.
 */

export type PerfMode = 'auto' | PerfTier

export interface PersistedSettings {
  perfMode: PerfMode
  reducedMotionOverride: boolean | null // null = follow system
  volume: number
}

interface SettingsContextValue extends PersistedSettings {
  /** Effective tier after auto-detection + FPS refinement */
  tier: PerfTier
  /** Effective reduced-motion (system OR override) */
  reducedMotion: boolean
  systemReducedMotion: boolean
  setPerfMode: (mode: PerfMode) => void
  setReducedMotionOverride: (value: boolean | null) => void
  setVolume: (v: number) => void
  /** Feed a measured FPS sample (auto mode only, one-way refinement) */
  reportFps: (fps: number) => void
}

const DEFAULTS: PersistedSettings = {
  perfMode: 'auto',
  reducedMotionOverride: null,
  volume: 0.72,
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}

function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PersistedSettings>(() => ({
    ...DEFAULTS,
    ...readJSON<Partial<PersistedSettings>>(STORAGE_KEYS.settings, {}),
  }))
  const [autoTier, setAutoTier] = useState<PerfTier>(() => detectPerfTier())
  const systemReducedMotion = useSystemReducedMotion()

  useEffect(() => {
    writeJSON(STORAGE_KEYS.settings, settings)
  }, [settings])

  const setPerfMode = useCallback((mode: PerfMode) => {
    setSettings((s) => ({ ...s, perfMode: mode }))
    if (mode === 'auto') setAutoTier(detectPerfTier())
  }, [])

  const setReducedMotionOverride = useCallback((value: boolean | null) => {
    setSettings((s) => ({ ...s, reducedMotionOverride: value }))
  }, [])

  const setVolume = useCallback((v: number) => {
    setSettings((s) => ({ ...s, volume: Math.min(1, Math.max(0, v)) }))
  }, [])

  const reportFps = useCallback((fps: number) => {
    setSettings((current) => {
      if (current.perfMode !== 'auto') return current
      setAutoTier((t) => tierFromFps(fps, t))
      return current
    })
  }, [])

  const value = useMemo<SettingsContextValue>(() => {
    const tier: PerfTier = settings.perfMode === 'auto' ? autoTier : settings.perfMode
    return {
      ...settings,
      tier,
      systemReducedMotion,
      reducedMotion: systemReducedMotion || settings.reducedMotionOverride === true,
      setPerfMode,
      setReducedMotionOverride,
      setVolume,
      reportFps,
    }
  }, [settings, autoTier, systemReducedMotion, setPerfMode, setReducedMotionOverride, setVolume, reportFps])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
