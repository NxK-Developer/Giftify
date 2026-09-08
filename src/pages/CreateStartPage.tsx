import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, RotateCcw, FlaskConical } from 'lucide-react'
import WizardShell, { WIZARD_STEPS } from '@/components/creator/WizardShell'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import GradientBlobs from '@/components/background/GradientBlobs'
import { useCreator } from '@/store/CreatorContext'
import { useAuth } from '@/store/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import { getOccasion } from '@/constants/occasions'
import { getTemplate } from '@/constants/templates'
import { getTheme } from '@/constants/themes'

/**
 * /create — the creator entry hub. Shows draft status, the full step map and
 * jumps to the right place: resume an in-progress draft or start fresh.
 */
export default function CreateStartPage() {
  useSeo({
    title: 'Create a Greeting — NxK Greetings',
    description: 'Start your cinematic personalized greeting: pick an occasion, template, theme, animation and music in minutes.',
    canonicalPath: '/create',
  })
  const { wizard, hasAnyContent, resetWizard, editing } = useCreator()
  const { isDemoMode } = useAuth()
  const navigate = useNavigate()

  const template = getTemplate(wizard.templateId)
  const occasion = wizard.occasion ? getOccasion(wizard.occasion) : null

  // Resume at the first incomplete step
  const resumeTarget = (() => {
    if (!wizard.occasion) return '/occasion'
    if (!wizard.templateId) return '/templates'
    if (!wizard.recipientName.trim() || !wizard.message.trim()) return '/personalize'
    if (!wizard.theme) return '/theme'
    if (!wizard.animation) return '/animation'
    if (!wizard.music) return '/music'
    return '/preview'
  })()

  return (
    <WizardShell step="occasion" title="Let’s build a surprise ✨" subtitle="Every great greeting starts with a feeling. Here’s the journey — your progress saves automatically." hideFooter>
      <GradientBlobs minimal className="opacity-60" />

      <div className="relative grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* Steps map */}
        <GlassCard className="p-6">
          <h2 className="font-display text-base font-bold text-ink">The flow</h2>
          <ol className="mt-4 space-y-1">
            {WIZARD_STEPS.map((s, i) => (
              <li key={s.id}>
                <Link
                  to={s.path}
                  className="group flex min-h-12 items-center gap-3.5 rounded-2xl px-3 transition hover:bg-white/5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 font-mono text-xs font-bold text-brand-soft">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-ink-dim transition group-hover:text-ink">
                    {s.label}
                  </span>
                  <span className="ml-auto text-muted opacity-0 transition group-hover:opacity-100" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 sweep-once"
              icon={<Sparkles className="size-5" />}
              onClick={() => navigate(hasAnyContent ? resumeTarget : '/occasion')}
            >
              {hasAnyContent ? 'Resume where you left off' : 'Start Creating'}
            </Button>
          </div>
        </GlassCard>

        {/* Current draft snapshot */}
        <div className="space-y-4">
          <GlassCard strong className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-bold text-ink">
                {editing ? 'Editing greeting' : 'Your draft'}
              </h2>
              {hasAnyContent && (
                <button
                  type="button"
                  onClick={() => {
                    resetWizard()
                    navigate('/occasion')
                  }}
                  className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-white/6 hover:text-danger"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Start over
                </button>
              )}
            </div>

            {hasAnyContent ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Occasion</dt>
                  <dd className="font-semibold text-ink-dim">
                    {occasion ? `${occasion.emoji} ${occasion.name}` : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Template</dt>
                  <dd className="font-semibold text-ink-dim">{template ? `${template.accentEmoji} ${template.name}` : '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Recipient</dt>
                  <dd className="truncate font-semibold text-ink-dim">{wizard.recipientName || '—'}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Theme</dt>
                  <dd className="font-semibold text-ink-dim">
                    {wizard.theme ? `${getTheme(wizard.theme).emoji} ${getTheme(wizard.theme).name}` : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Message</dt>
                  <dd className="max-w-[55%] truncate text-right font-semibold text-ink-dim">
                    {wizard.message || '—'}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Nothing saved yet. Pick an occasion and your choices will autosave here — even if you close the
                tab by accident.
              </p>
            )}
          </GlassCard>

          {isDemoMode && (
            <GlassCard className="border-gold/20 p-5">
              <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gold/90">
                <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong className="font-bold">Demo Mode:</strong> Firebase isn’t configured on this deployment,
                  so generated greetings are saved <strong>on this device only</strong> and links won’t open on
                  other phones. Everything else — themes, animations, music, QR, preview — is fully real.
                </span>
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </WizardShell>
  )
}
