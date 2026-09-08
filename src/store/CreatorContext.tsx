import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Greeting, TemplateConfig, WizardState } from '@/types'
import { EMPTY_WIZARD, loadDraft, saveDraft, clearDraft } from '@/services/draftService'
import { getTemplate } from '@/constants/templates'
import { markDraftStarted } from '@/services/analyticsService'
import { useToast } from './ToastContext'

/**
 * CreatorContext — the wizard state machine behind the whole creator flow
 * (/occasion → … → /generate). Auto-saves every change to LocalStorage as a
 * draft, restores it after refresh/crash with a "Draft restored" toast, and
 * exposes template application + validation helpers.
 *
 * The password field lives in memory only and is never persisted.
 */

type Action =
  | { type: 'patch'; patch: Partial<WizardState> }
  | { type: 'applyTemplate'; template: TemplateConfig }
  | { type: 'loadGreeting'; greeting: Greeting; editMode: boolean }
  | { type: 'replace'; state: WizardState }
  | { type: 'reset' }

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch }
    case 'applyTemplate': {
      const t = action.template
      return {
        ...state,
        templateId: t.id,
        occasion: t.occasion,
        theme: t.theme,
        animation: t.animation,
        music: t.music,
        // Pre-fill text only when the creator hasn't written their own yet.
        message: state.message.trim() ? state.message : t.defaultText.message,
      }
    }
    case 'loadGreeting': {
      const g = action.greeting
      return {
        ...state,
        occasion: g.occasion,
        templateId: g.templateId,
        recipientName: g.recipientName,
        senderName: g.senderName,
        nickname: g.nickname ?? '',
        relationship: g.relationship ?? '',
        specialDate: g.specialDate ?? '',
        message: g.message,
        theme: g.theme,
        animation: g.animation,
        music: g.music,
        privacy: g.privacy,
        scheduledAt: g.scheduledAt,
        expiresAt: g.expiresAt,
        password: '',
      }
    }
    case 'replace':
      return action.state
    case 'reset':
      return { ...EMPTY_WIZARD }
    default:
      return state
  }
}

export interface EditingTarget {
  greetingId: string
  isDemo: boolean
}

interface CreatorContextValue {
  wizard: WizardState
  patch: (patch: Partial<WizardState>) => void
  applyTemplate: (template: TemplateConfig) => void
  loadGreetingForEdit: (greeting: Greeting) => void
  editing: EditingTarget | null
  clearEditing: () => void
  resetWizard: (opts?: { clearDraft?: boolean }) => void
  /** Template resolved from wizard state (fallback to defaults) */
  activeTemplate: TemplateConfig | undefined
  /** True when a persisted draft was restored this session */
  draftRestored: boolean
  dismissDraftNotice: () => void
  hasAnyContent: boolean
}

const CreatorContext = createContext<CreatorContextValue | null>(null)

export function useCreator(): CreatorContextValue {
  const ctx = useContext(CreatorContext)
  if (!ctx) throw new Error('useCreator must be used inside <CreatorProvider>')
  return ctx
}

export function CreatorProvider({ children }: { children: ReactNode }) {
  // Draft restore happens during lazy initialisation (render-pure: reading
  // localStorage is a stable external store read, no timers or randomness).
  const [initialDraft] = useState(() => loadDraft())
  const [wizard, dispatch] = useReducer(reducer, initialDraft ?? EMPTY_WIZARD)
  const [draftRestored, setDraftRestored] = useState(initialDraft !== null)
  const [editing, setEditing] = useState<EditingTarget | null>(null)
  const startedCounted = useRef(false)
  const { pushToast } = useToast()

  /* Notify about restoration (after toast provider is ready) */
  const notified = useRef(false)
  useEffect(() => {
    if (draftRestored && !notified.current) {
      notified.current = true
      pushToast('info', 'Draft restored ✨', 'We picked up exactly where you left off.', 5000)
    }
  }, [draftRestored, pushToast])

  /* Auto-save drafts (debounced) */
  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(wizard), 350)
    return () => window.clearTimeout(timer)
  }, [wizard])

  /* Count a "draft started" once per session of meaningful editing */
  useEffect(() => {
    if (startedCounted.current) return
    const meaningful = wizard.occasion || wizard.recipientName || wizard.message
    if (meaningful) {
      startedCounted.current = true
      markDraftStarted()
    }
  }, [wizard.occasion, wizard.recipientName, wizard.message])

  const patch = useCallback((p: Partial<WizardState>) => dispatch({ type: 'patch', patch: p }), [])

  const applyTemplate = useCallback(
    (template: TemplateConfig) => dispatch({ type: 'applyTemplate', template }),
    [],
  )

  const loadGreetingForEdit = useCallback((greeting: Greeting) => {
    dispatch({ type: 'loadGreeting', greeting, editMode: true })
    setEditing({ greetingId: greeting.id, isDemo: Boolean(greeting.isDemo) })
  }, [])

  const clearEditing = useCallback(() => setEditing(null), [])

  const resetWizard = useCallback((opts?: { clearDraft?: boolean }) => {
    dispatch({ type: 'reset' })
    setEditing(null)
    startedCounted.current = false
    if (opts?.clearDraft !== false) clearDraft()
  }, [])

  const dismissDraftNotice = useCallback(() => setDraftRestored(false), [])

  const activeTemplate = useMemo(() => getTemplate(wizard.templateId), [wizard.templateId])

  const hasAnyContent = useMemo(
    () =>
      Boolean(
        wizard.occasion ||
          wizard.templateId ||
          wizard.recipientName.trim() ||
          wizard.senderName.trim() ||
          wizard.message.trim() ||
          wizard.theme,
      ),
    [wizard],
  )

  const value = useMemo<CreatorContextValue>(
    () => ({
      wizard,
      patch,
      applyTemplate,
      loadGreetingForEdit,
      editing,
      clearEditing,
      resetWizard,
      activeTemplate,
      draftRestored,
      dismissDraftNotice,
      hasAnyContent,
    }),
    [
      wizard,
      patch,
      applyTemplate,
      loadGreetingForEdit,
      editing,
      clearEditing,
      resetWizard,
      activeTemplate,
      draftRestored,
      dismissDraftNotice,
      hasAnyContent,
    ],
  )

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>
}
