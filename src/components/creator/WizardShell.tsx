import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, X, FlaskConical } from 'lucide-react'
import NxKMonogram from '@/components/common/NxKMonogram'
import Button from '@/components/common/Button'
import { cn } from '@/utils/cn'
import { useAuth } from '@/store/AuthContext'

export const WIZARD_STEPS = [
  { id: 'occasion', label: 'Occasion', path: '/occasion' },
  { id: 'template', label: 'Template', path: '/templates' },
  { id: 'personalize', label: 'Personalize', path: '/personalize' },
  { id: 'theme', label: 'Theme', path: '/theme' },
  { id: 'animation', label: 'Animation', path: '/animation' },
  { id: 'music', label: 'Music', path: '/music' },
  { id: 'preview', label: 'Preview', path: '/preview' },
  { id: 'share', label: 'Share', path: '/share' },
] as const

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['id']

export interface WizardShellProps {
  step: WizardStepKey
  title: string
  subtitle?: string
  children: ReactNode
  /** Continue handler; omit to hide the primary footer button */
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextLoading?: boolean
  /** Back handler; defaults to the previous wizard step */
  onBack?: () => void
  backDisabled?: boolean
  footerNote?: ReactNode
  /** Hide the footer nav (pages that manage their own actions) */
  hideFooter?: boolean
}

/**
 * WizardShell — the shared chrome for every creator-flow step:
 * brand header, step rail (scrollable on mobile), content and nav footer.
 * Deliberately calm and "studio-like" so it feels completely different
 * from the recipient's cinematic experience.
 */
export default function WizardShell({
  step,
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  nextLoading,
  onBack,
  backDisabled,
  footerNote,
  hideFooter,
}: WizardShellProps) {
  const navigate = useNavigate()
  const { isDemoMode } = useAuth()
  const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === step)
  const prevStep = stepIndex > 0 ? WIZARD_STEPS[stepIndex - 1] : null

  const handleBack = () => {
    if (onBack) onBack()
    else if (prevStep) navigate(prevStep.path)
    else navigate('/create')
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-base">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-base-2/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 press" aria-label="NxK Greetings home">
            <NxKMonogram size="xs" glow={false} />
            <span className="hidden font-display text-sm font-bold text-ink sm:block">
              NxK <span className="text-gradient">Greetings</span>
            </span>
          </Link>

          {isDemoMode && (
            <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold">
              <FlaskConical className="size-3" aria-hidden="true" />
              DEMO
            </span>
          )}

          <Link
            to="/"
            className="flex size-10 items-center justify-center rounded-xl text-muted transition hover:bg-white/6 hover:text-ink"
            aria-label="Exit creator and go home"
          >
            <X className="size-5" aria-hidden="true" />
          </Link>
        </div>

        {/* Step rail */}
        <nav aria-label="Creator steps" className="no-scrollbar mx-auto max-w-5xl overflow-x-auto px-4 pb-2.5 sm:px-6">
          <ol className="flex items-center gap-1.5">
            {WIZARD_STEPS.map((s, i) => {
              const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'
              return (
                <li key={s.id} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className={cn('h-px w-3 sm:w-5', i <= stepIndex ? 'bg-brand-soft/70' : 'bg-line-strong')}
                    />
                  )}
                  <span
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
                      state === 'current' &&
                        'border-brand-soft/60 bg-brand/15 text-ink shadow-[0_0_16px_rgba(139,92,246,0.35)]',
                      state === 'done' && 'border-success/30 bg-success/8 text-success',
                      state === 'todo' && 'border-line bg-transparent text-muted/70',
                    )}
                  >
                    <span aria-hidden="true">{state === 'done' ? '✓' : i + 1}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-36 pt-7 sm:px-6 sm:pt-10">
        <div className="animate-fade-up">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">{subtitle}</p>}
        </div>
        <div className="mt-7">{children}</div>
      </main>

      {/* Footer nav */}
      {!hideFooter && (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-base-2/90 backdrop-blur-xl safe-bottom">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pt-3 sm:px-6">
            <Button
              variant="ghost"
              size="md"
              onClick={handleBack}
              disabled={backDisabled}
              icon={<ChevronLeft className="size-4" />}
              className="shrink-0"
              aria-label={prevStep ? `Back to ${prevStep.label}` : 'Back'}
            >
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              {footerNote && <p className="truncate text-[11px] text-muted">{footerNote}</p>}
            </div>
            {onNext && (
              <Button
                size="md"
                onClick={onNext}
                disabled={nextDisabled}
                loading={nextLoading}
                className="shrink-0 sm:min-w-40"
              >
                {nextLabel}
                {!nextLoading && <ChevronRight className="size-4" aria-hidden="true" />}
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
