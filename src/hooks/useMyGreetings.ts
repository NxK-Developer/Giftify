import { useCallback, useEffect, useState } from 'react'
import type { Greeting } from '@/types'
import { useAuth } from '@/store/AuthContext'
import { listMyGreetings, GreetingError } from '@/services/greetingService'
import { getLocalDemoSession } from '@/services/authService'

/**
 * useMyGreetings — loads the current creator's greetings from the right
 * backend (Firestore or on-device demo store), with honest loading/error
 * states and a reload trigger after mutations.
 */
export function useMyGreetings() {
  const { ownerId, isDemoMode } = useAuth()
  const effectiveOwner = ownerId ?? (isDemoMode ? getLocalDemoSession().uid : null)

  const [greetings, setGreetings] = useState<Greeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!effectiveOwner) return
    let alive = true
    listMyGreetings(effectiveOwner)
      .then((list) => {
        if (alive) setGreetings(list)
      })
      .catch((err) => {
        if (alive) setError(err instanceof GreetingError ? err.message : 'Failed to load your greetings.')
      })
      .finally(() => {
        if (alive) setRefreshing(false)
      })
    return () => {
      alive = false
    }
  }, [effectiveOwner, reloadKey])

  const reload = useCallback(() => {
    setRefreshing(true)
    setReloadKey((k) => k + 1)
  }, [])

  const list = effectiveOwner ? greetings : []

  return {
    greetings: list,
    error,
    reload,
    refreshing,
    loading: Boolean(effectiveOwner) && greetings === null && error === null,
    owner: effectiveOwner,
  }
}
