import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shuffle, Eraser, WandSparkles } from 'lucide-react'
import WizardShell from '@/components/creator/WizardShell'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import EmojiPicker from '@/components/common/EmojiPicker'
import { Input, Textarea, Select } from '@/components/common/Input'
import LivePreviewCard from '@/components/creator/LivePreviewCard'
import { useCreator } from '@/store/CreatorContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { getOccasion } from '@/constants/occasions'
import { getTemplate } from '@/constants/templates'
import { RELATIONSHIP_OPTIONS, LIMITS } from '@/constants/limits'
import { sanitizeLine, sanitizeMultiline, countCharacters } from '@/utils/sanitize'
import { validateWizard } from '@/utils/validate'

/**
 * Personalize — names, relationship, special date and the message itself.
 * Everything is sanitized on input (angle brackets/control chars stripped),
 * length-capped, and previewed live. No HTML ever reaches storage or DOM.
 */
export default function PersonalizePage() {
  useSeo({
    title: 'Personalize Your Greeting — NxK Greetings',
    description: 'Add names, a nickname, your own heartfelt words and emoji. Live preview as you type.',
    canonicalPath: '/personalize',
  })
  const { wizard, patch } = useCreator()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const [touched, setTouched] = useState(false)

  const occasion = wizard.occasion ? getOccasion(wizard.occasion) : null
  const template = getTemplate(wizard.templateId)

  const issues = useMemo(() => validateWizard(wizard), [wizard])
  const issueFor = (field: string) =>
    touched ? issues.find((i) => i.field === field)?.message ?? null : null

  const insertEmoji = (emoji: string) => {
    const ta = messageRef.current
    const current = wizard.message
    if (ta && typeof ta.selectionStart === 'number') {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const next = sanitizeMultiline(current.slice(0, start) + emoji + current.slice(end), LIMITS.message.max)
      patch({ message: next })
      requestAnimationFrame(() => {
        ta.focus()
        const pos = Math.min(start + emoji.length, next.length)
        ta.setSelectionRange(pos, pos)
      })
    } else {
      patch({ message: sanitizeMultiline(current + emoji, LIMITS.message.max) })
    }
  }

  const randomSuggestion = () => {
    const pool = occasion?.suggestions ?? []
    if (pool.length === 0) return
    const next = pool[Math.floor(Math.random() * pool.length)] ?? ''
    if (next === wizard.message) {
      patch({ message: pool[(pool.indexOf(next) + 1) % pool.length] ?? next })
    } else {
      patch({ message: next })
    }
    pushToast('info', 'Suggestion added ✨', 'Edit it freely — make it sound like you.')
  }

  const canContinue =
    wizard.recipientName.trim().length > 0 &&
    wizard.message.trim().length > 0 &&
    !issues.some((i) => ['recipientName', 'message', 'nickname', 'senderName'].includes(String(i.field)))

  return (
    <WizardShell
      step="personalize"
      title="Make it theirs ✍️"
      subtitle="Names and a few honest words — that’s the whole secret. Emoji welcome."
      onNext={() => {
        setTouched(true)
        if (!canContinue) {
          pushToast('error', 'Almost there', 'Add a recipient name and your message to continue.')
          return
        }
        navigate('/theme')
      }}
      nextLabel="Pick a theme"
      footerNote={`${countCharacters(wizard.message)}/${LIMITS.message.max} characters`}
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Form */}
        <GlassCard className="p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Recipient name *"
              placeholder="e.g. Aarav"
              value={wizard.recipientName}
              maxLength={LIMITS.recipientName.max + 5}
              onChange={(e) => patch({ recipientName: sanitizeLine(e.target.value, LIMITS.recipientName.max) })}
              onBlur={() => setTouched(true)}
              error={issueFor('recipientName')}
              counter={{ current: countCharacters(wizard.recipientName), max: LIMITS.recipientName.max }}
              autoComplete="off"
            />
            <Input
              label="Your name (sender)"
              placeholder="e.g. Ananya"
              value={wizard.senderName}
              maxLength={LIMITS.senderName.max + 5}
              onChange={(e) => patch({ senderName: sanitizeLine(e.target.value, LIMITS.senderName.max) })}
              error={issueFor('senderName')}
              hint="Optional — shown as “with love, …”"
              autoComplete="off"
            />
            <Input
              label="Nickname"
              placeholder="e.g. Aaru"
              value={wizard.nickname}
              maxLength={LIMITS.nickname.max + 5}
              onChange={(e) => patch({ nickname: sanitizeLine(e.target.value, LIMITS.nickname.max) })}
              error={issueFor('nickname')}
              hint="Used in the reveal: “Hey, Aaru ❤️”"
              autoComplete="off"
            />
            <Select
              label="Relationship"
              value={wizard.relationship}
              onChange={(e) => patch({ relationship: e.target.value })}
              placeholder="Choose (optional)"
              options={RELATIONSHIP_OPTIONS.map((r) => ({ value: r, label: r }))}
            />
            <div className="sm:col-span-2">
              <Input
                label="Special date"
                type="date"
                value={wizard.specialDate}
                max="2100-12-31"
                onChange={(e) => patch({ specialDate: sanitizeLine(e.target.value, 24) })}
                hint="Birthdays, anniversaries, first-meet days — shown gently in the final scene."
              />
            </div>
          </div>

          {/* Message */}
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <EmojiPicker onPick={insertEmoji} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={<Shuffle className="size-3.5" />}
                  onClick={randomSuggestion}
                  disabled={!occasion}
                >
                  Surprise me
                </Button>
                {wizard.message && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<Eraser className="size-3.5" />}
                    onClick={() => patch({ message: '' })}
                    aria-label="Clear message"
                  >
                    Clear
                  </Button>
                )}
              </div>
              {template && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-muted transition hover:text-brand-soft"
                  onClick={() => patch({ message: template.defaultText.message })}
                >
                  <WandSparkles className="size-3.5" aria-hidden="true" />
                  Use template text
                </button>
              )}
            </div>
            <Textarea
              ref={messageRef}
              label="Your message *"
              placeholder={
                occasion
                  ? `Write from the heart… or tap “Surprise me” for ${occasion.name.toLowerCase()} ideas.`
                  : 'Write from the heart…'
              }
              rows={6}
              value={wizard.message}
              onChange={(e) => patch({ message: sanitizeMultiline(e.target.value, LIMITS.message.max) })}
              onBlur={() => setTouched(true)}
              error={issueFor('message')}
              counter={{ current: countCharacters(wizard.message), max: LIMITS.message.max }}
            />
          </div>

          {/* Suggestion chips */}
          {occasion && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold tracking-[0.18em] text-muted uppercase">
                Message ideas · {occasion.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {occasion.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => patch({ message: sanitizeMultiline(s, LIMITS.message.max) })}
                    className="max-w-full truncate rounded-full border border-line bg-white/3 px-3.5 py-2 text-left text-xs text-ink-dim transition hover:border-brand-soft/50 hover:bg-brand/10 hover:text-ink press"
                    title={s}
                  >
                    {s.length > 52 ? `${s.slice(0, 52)}…` : s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Live preview */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-2.5 text-[11px] font-bold tracking-[0.2em] text-muted uppercase">Live preview</p>
          <LivePreviewCard wizard={wizard} />
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
            The real experience is full-screen and cinematic — this card updates as you type.
          </p>
        </div>
      </div>
    </WizardShell>
  )
}
