/**
 * Safe localStorage wrapper — private-mode friendly, never throws,
 * and namespaced through STORAGE_KEYS by callers.
 */

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function readNumber(key: string, fallback = 0): number {
  const value = readJSON<number | null>(key, null)
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** sessionStorage variant (per-tab), used for view de-duplication. */
export function sessionHas(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) != null
  } catch {
    return false
  }
}

export function sessionSet(key: string, value = '1'): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}
