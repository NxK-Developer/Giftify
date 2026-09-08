import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { CreateGreetingInput, CreateGreetingResult, Greeting } from '@/types'
import NxKMonogram from '@/components/common/NxKMonogram'
import Button from '@/components/common/Button'
import ErrorState from '@/components/common/ErrorState'
import ProgressBar from '@/components/common/ProgressBar'
import GradientBlobs from '@/components/background/GradientBlobs'
import { useCreator } from '@/store/CreatorContext'
import { useAuth } from '@/store/AuthContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { validateWizard } from '@/utils/validate'
import { createGreeting, GreetingError } from '@/services/greetingService'
import { markGreetingCompleted } from '@/services/analyticsService'
import { getLocalDemoSession } from '@/services/authService'
import { isFirebaseConfigured } from '@/lib/env'

const STAGE_LINES = [
  'Validating your surprise…',
  'Composing theme, particles & music…',
  'Minting your unique link…',
  'Sealing it with a heartbeat…',
]

type Phase = 'running' | 'error' | 'redirecting'

interface GenError {
  message: string
  /** True when the failure was auth-side and local save is a fair fallback */
  canFallbackLocal: boolean
}

/**
 * /generate — executes greeting creation with a branded progress screen.
 * Real work only: validation → (guest auth if needed) → Firestore/local
 * store → redirect to /share. Errors always surface with retry, and when
 * Firebase auth itself fails we honestly offer on-device saving instead.
 */
export default function GeneratePage() {
  useSeo({ title: 'Generating your greeting… ✨', noindex: true })
  const { wizard, resetWizard, editing, clearEditing } = useCreator()
  const { session, continueAsGuest, isDemoMode } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()

  const issues = validateWizard(wizard)
  const [phase, setPhase] = useState<Phase>('running')
  const [lineIdx, setLineIdx] = useState(0)
  const [progress, setProgress] = useState(8)
  const [genError, setGenError] = useState<GenError | null>(null)
  const executing = useRef(false)
  const [forceLocal, setForceLocal] = useState(false)

  // Rotating cinematic status lines while working
  useEffect(() => {
    if (phase !== 'running') return
    const t = window.setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, STAGE_LINES.length - 1))
      setProgress((p) => Math.min(p + 12, 88))
    }, 850)
    return () => window.clearInterval(t)
  }, [phase])

  const buildInput = useCallback((): CreateGreetingInput | null => {
    if (
      !wizard.occasion ||
      !wizard.templateId ||
      !wizard.theme ||
      !wizard.animation
    ) {
      return null
    }
    return {
      occasion: wizard.occasion,
      templateId: wizard.templateId,
      recipientName: wizard.recipientName,
      senderName: wizard.senderName,
      nickname: wizard.nickname,
      relationship: wizard.relationship,
      specialDate: wizard.specialDate,
      message: wizard.message,
      theme: wizard.theme,
      animation: wizard.animation,
      music: wizard.music,
      privacy: wizard.privacy,
      scheduledAt: wizard.scheduledAt ? new Date(wizard.scheduledAt) : null,
      expiresAt: wizard.expiresAt ? new Date(wizard.expiresAt) : null,
      password: wizard.password || null,
    }
  }, [wizard])

  const run = useCallback(
    async (localFallback: boolean) => {
      const input = buildInput()
      if (!input) {
        setPhase('error')
        setGenError({ message: 'Your greeting config is incomplete.', canFallbackLocal: false })
        return
      }
      setPhase('running')
      setGenError(null)
      setProgress(10)

      try {
        // Resolve the owner honestly.
        let ownerId = session?.uid ?? null
        if (!ownerId) {
          if (isFirebaseConfigured && !localFallback) {
            // Real Firebase anonymous guest session — no fake auth.
            const guest = await continueAsGuest()
            ownerId = guest.uid
          } else {
            ownerId = getLocalDemoSession().uid
          }
        }

        setProgress(42)
        const result: CreateGreetingResult = await createGreeting(input, ownerId, {
          forceLocal: localFallback || isDemoMode,
        })
        setProgress(80)

        // Snapshot for the share screen (survives wizard reset)
        const snapshot: Greeting = {
          ...input,
          id: result.id,
          ownerId,
          status: 'active',
          views: 0,
          shares: 0,
          scheduledAt: input.scheduledAt ? input.scheduledAt.toISOString() : null,
          expiresAt: input.expiresAt ? input.expiresAt.toISOString() : null,
          passwordHash: null,
          passwordSalt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          isDemo: result.isDemo,
        }

        markGreetingCompleted()
        setProgress(100)
        setPhase('redirecting')

        if (editing) clearEditing()
        resetWizard()

        if (localFallback && !isDemoMode) {
          pushToast(
            'info',
            'Saved on this device only',
            'Cloud accounts weren’t reachable, so your greeting lives in this browser. It opens fine here.',
            7000,
          )
        } else if (result.isDemo) {
          pushToast('info', 'Demo Mode greeting created', 'Saved on this device — clearly labeled as demo data.', 5500)
        } else {
          pushToast('success', 'Greeting created 🎉', 'Your unique link is ready to share.')
        }

        window.setTimeout(() => {
          navigate('/share', { state: { result, snapshot }, replace: true })
        }, 420)
      } catch (err) {
        setPhase('error')
        const message = err instanceof GreetingError ? err.message : 'Something went wrong while creating your greeting.'
        const authSide =
          !localFallback &&
          isFirebaseConfigured &&
          /anonymous|auth|network|sign-in|disabled/i.test(message)
        setGenError({ message, canFallbackLocal: authSide || isFirebaseConfigured })
      }
    },
    [buildInput, session, continueAsGuest, isDemoMode, editing, clearEditing, resetWizard, navigate, pushToast],
  )

  // Auto-run once on mount (StrictMode double-effect safe)
  useEffect(() => {
    if (executing.current) return
    if (issues.length > 0) return // Navigate guard handles this case
    executing.current = true
    // Kick off in a microtask so no state updates run synchronously in the effect.
    void Promise.resolve().then(() => run(forceLocal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (issues.length > 0 && phase !== 'redirecting') {
    return <Navigate to="/preview" replace />
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5">
      <GradientBlobs minimal />
      <div className="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md text-center">
        {phase !== 'error' ? (
          <>
            <div className="relative mx-auto w-fit">
              <div className="absolute -inset-8 rounded-full bg-brand/18 blur-2xl animate-pulse-glow" aria-hidden="true" />
              <NxKMonogram size="xl" className="relative animate-heartbeat" />
            </div>
            <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight text-ink">
              Generating your greeting
            </h1>
            <p key={lineIdx} className="mt-2.5 h-5 font-mono text-[12.5px] tracking-wide text-brand-soft animate-fade-in">
              {STAGE_LINES[lineIdx]}
            </p>
            <ProgressBar value={progress} className="mt-7" label="Greeting creation progress" />
            <p className="mt-3 text-[11px] text-muted">
              {isDemoMode ? 'Saving to this device (Demo Mode)' : 'Saving to your account'} — this takes a second.
            </p>
          </>
        ) : (
          <ErrorState
            title="We couldn’t generate your greeting"
            message={genError?.message ?? 'Something went wrong.'}
            onRetry={() => {
              executing.current = true
              setLineIdx(0)
              setProgress(8)
              void run(forceLocal)
            }}
            secondaryAction={
              genError?.canFallbackLocal && !forceLocal ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setForceLocal(true)
                    executing.current = true
                    setLineIdx(0)
                    setProgress(8)
                    void run(true)
                  }}
                >
                  Save on this device instead
                </Button>
              ) : (
                <Button variant="ghost" size="sm" to="/preview">
                  Back to preview
                </Button>
              )
            }
          />
        )}
      </div>
    </div>
  )
}
