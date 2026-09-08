import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Lock, Globe, Link2, Timer, CalendarClock, KeyRound, EyeOff } from 'lucide-react'
import type { Greeting, PrivacyMode } from '@/types'
import WizardShell from '@/components/creator/WizardShell'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import RecipientExperience from '@/components/recipient/RecipientExperience'
import { useCreator } from '@/store/CreatorContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { validateWizard } from '@/utils/validate'
import { cn } from '@/utils/cn'

/* datetime-local <-> ISO helpers */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(value: string): string | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const PRIVACY_OPTIONS: {
  id: PrivacyMode
  label: string
  icon: typeof Globe
  description: string
}[] = [
  {
    id: 'unlisted',
    label: 'Unlisted',
    icon: Link2,
    description: 'Only people with the link can open it. The default — private moments stay private.',
  },
  {
    id: 'public',
    label: 'Public',
    icon: Globe,
    description: 'Opens with the link and may be eligible for future public showcases on NxK Greetings.',
  },
  {
    id: 'private',
    label: 'Private',
    icon: Lock,
    description: 'Only you (and admins) can open it — recipients see “unavailable”. Good for drafts.',
  },
]

/**
 * /preview — the creator watches the REAL recipient experience (same
 * engines, same sequence) inside a stage frame, then tunes privacy,
 * scheduling, expiry and an optional password before generating.
 */
export default function PreviewPage() {
  useSeo({
    title: 'Preview Your Greeting — NxK Greetings',
    description: 'Watch the full cinematic sequence exactly as your recipient will, then set privacy, schedule and expiry.',
    canonicalPath: '/preview',
  })
  const { wizard, patch } = useCreator()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [previewKey, setPreviewKey] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  const issues = useMemo(() => validateWizard(wizard), [wizard])

  const previewGreeting: Greeting = useMemo(
    () => ({
      id: 'preview',
      ownerId: 'preview',
      occasion: wizard.occasion ?? 'custom',
      templateId: wizard.templateId ?? '',
      recipientName: wizard.recipientName.trim() || 'Friend',
      senderName: wizard.senderName.trim(),
      nickname: wizard.nickname.trim(),
      relationship: wizard.relationship,
      specialDate: wizard.specialDate,
      message: wizard.message.trim() || 'Your message will appear right here, word by word…',
      theme: wizard.theme ?? 'galaxy',
      animation: wizard.animation ?? 'code-intro',
      music: wizard.music,
      privacy: wizard.privacy,
      status: 'active',
      views: 0,
      shares: 0,
      scheduledAt: wizard.scheduledAt,
      expiresAt: wizard.expiresAt,
      passwordHash: null,
      passwordSalt: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      isDemo: true,
    }),
    [wizard],
  )

  const handleGenerate = () => {
    if (issues.length > 0) {
      const first = issues[0]
      pushToast('error', 'A few things are missing', first?.message ?? 'Complete the required steps first.')
      // Route the creator to the earliest incomplete step
      const field = String(first?.field ?? '')
      if (field === 'occasion') navigate('/occasion')
      else if (field === 'templateId') navigate('/templates')
      else if (['recipientName', 'message', 'senderName', 'nickname'].includes(field)) navigate('/personalize')
      else if (field === 'theme') navigate('/theme')
      else if (field === 'animation') navigate('/animation')
      else if (field === 'music') navigate('/music')
      return
    }
    navigate('/generate')
  }

  return (
    <WizardShell
      step="preview"
      title="The moment of truth 🎬"
      subtitle="This is the real sequence — the exact engines, timings and music your recipient will experience."
      onNext={handleGenerate}
      nextLabel="Generate Greeting ✨"
      nextDisabled={false}
      footerNote={issues.length > 0 ? `${issues.length} step(s) need attention` : 'Everything looks ready ✓'}
    >
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Experience stage */}
        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-muted uppercase">
              <Eye className="size-3.5" aria-hidden="true" /> Live preview
            </p>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="text-[11px] font-semibold text-brand-soft transition hover:text-accent-soft"
            >
              ↺ Restart preview
            </button>
          </div>
          <div className="relative h-[540px] overflow-hidden rounded-[2rem] border border-white/12 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:h-[600px]">
            <RecipientExperience
              key={previewKey}
              greeting={previewGreeting}
              preview
              contained
              onExit={() => setPreviewKey((k) => k + 1)}
            />
          </div>
          <p className="mt-2.5 text-center text-[11px] text-muted">
            Preview mode — nothing is tracked or saved here. Tap through it like a recipient would.
          </p>
        </div>

        {/* Privacy & timing */}
        <div className="space-y-4">
          <GlassCard className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Lock className="size-4 text-brand-soft" aria-hidden="true" />
              Privacy
            </h2>
            <div className="mt-3.5 space-y-2" role="radiogroup" aria-label="Privacy mode">
              {PRIVACY_OPTIONS.map((p) => {
                const selected = wizard.privacy === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => patch({ privacy: p.id })}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition press',
                      selected
                        ? 'border-brand-soft/60 bg-brand/10 shadow-[0_0_24px_-6px_rgba(139,92,246,0.45)]'
                        : 'border-line bg-white/3 hover:border-white/20',
                    )}
                  >
                    <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border', selected ? 'border-brand-soft/50 bg-brand/15 text-brand-soft' : 'border-line bg-white/4 text-muted')} aria-hidden="true">
                      <p.icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold text-ink">{p.label}</span>
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">{p.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <Timer className="size-4 text-neon" aria-hidden="true" />
              Schedule & expiry
              <span className="ml-auto text-[10px] font-semibold text-muted">(optional)</span>
            </h2>
            <div className="mt-3.5 space-y-4">
              <Input
                label="Unlock at (scheduled start)"
                type="datetime-local"
                icon={<CalendarClock className="size-4" />}
                value={toLocalInput(wizard.scheduledAt)}
                onChange={(e) => patch({ scheduledAt: fromLocalInput(e.target.value) })}
                hint="Before this moment, recipients see “This surprise isn’t ready yet ✨” with a countdown."
              />
              <div>
                <Input
                  label="Expires at"
                  type="datetime-local"
                  icon={<CalendarClock className="size-4" />}
                  value={toLocalInput(wizard.expiresAt)}
                  onChange={(e) => patch({ expiresAt: fromLocalInput(e.target.value) })}
                  hint="After this moment, the link politely closes."
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: '+7 days', days: 7 },
                    { label: '+30 days', days: 30 },
                    { label: '+1 year', days: 365 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        patch({ expiresAt: new Date(Date.now() + preset.days * 86_400_000).toISOString() })
                      }
                      className="rounded-full border border-line bg-white/3 px-3 py-1.5 text-[11px] font-semibold text-ink-dim transition hover:border-neon/40 hover:text-neon press"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {wizard.expiresAt && (
                    <button
                      type="button"
                      onClick={() => patch({ expiresAt: null })}
                      className="rounded-full border border-line bg-white/3 px-3 py-1.5 text-[11px] font-semibold text-muted transition hover:text-danger press"
                    >
                      Never expires
                    </button>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
              <KeyRound className="size-4 text-gold" aria-hidden="true" />
              Password lock
              <span className="ml-auto text-[10px] font-semibold text-muted">(optional)</span>
            </h2>
            <div className="mt-3.5">
              <div className="relative">
                <Input
                  label="Greeting password"
                  type={showPassword ? 'text' : 'password'}
                  value={wizard.password}
                  maxLength={64}
                  onChange={(e) => patch({ password: e.target.value })}
                  placeholder="e.g. our song's name"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-[34px] rounded-lg p-1.5 text-muted transition hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Recipients must enter it to open the surprise. Stored only as a PBKDF2-SHA256 hash with a random
                salt — never plaintext, and never kept in your browser draft.
              </p>
            </div>
          </GlassCard>

          <Button size="lg" fullWidth className="sweep-once" onClick={handleGenerate}>
            Generate Greeting ✨
          </Button>
        </div>
      </div>
    </WizardShell>
  )
}
