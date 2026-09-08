import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import WizardShell from '@/components/creator/WizardShell'
import TemplateCard from '@/components/creator/TemplateCard'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useCreator } from '@/store/CreatorContext'
import { useSeo } from '@/hooks/useSeo'
import { allTemplates, listEnabledTemplates } from '@/services/templateService'
import { getOccasion } from '@/constants/occasions'
import type { TemplateConfig } from '@/types'
import { cn } from '@/utils/cn'

export default function TemplatesPage() {
  useSeo({
    title: 'Choose a Template — NxK Greetings',
    description: 'Cinematic, romantic, playful and minimal greeting templates — each pre-tuned with theme, animation and music.',
    canonicalPath: '/templates',
  })
  const { wizard, applyTemplate, patch } = useCreator()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<TemplateConfig[] | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let alive = true
    void listEnabledTemplates(null).then((all) => {
      if (alive) setTemplates(all)
    })
    return () => {
      alive = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (!templates) return []
    if (showAll || !wizard.occasion) return templates
    const forOccasion = templates.filter((t) => t.occasion === wizard.occasion)
    return forOccasion.length > 0 ? forOccasion : templates
  }, [templates, wizard.occasion, showAll])

  const selectedTemplate = useMemo(
    () => allTemplates().find((t) => t.id === wizard.templateId),
    [wizard.templateId],
  )

  const occasion = wizard.occasion ? getOccasion(wizard.occasion) : null

  return (
    <WizardShell
      step="template"
      title={occasion ? `${occasion.emoji} ${occasion.name} templates` : 'Pick your template'}
      subtitle="Templates pre-tune the theme, animation style, music and opening words. You stay in full control on the next steps."
      onNext={() => navigate('/personalize')}
      nextDisabled={!wizard.templateId}
      nextLabel="Personalize it"
      footerNote={selectedTemplate ? `Selected: ${selectedTemplate.name}` : undefined}
    >
      {/* Filter chips */}
      {occasion && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Template filter">
          <button
            type="button"
            onClick={() => setShowAll(false)}
            aria-pressed={!showAll}
            className={cn(
              'min-h-10 rounded-full border px-4 text-[13px] font-semibold transition',
              !showAll
                ? 'border-brand-soft/60 bg-brand/15 text-ink shadow-[0_0_18px_rgba(139,92,246,0.3)]'
                : 'border-line bg-white/3 text-muted hover:text-ink',
            )}
          >
            {occasion.emoji} For {occasion.name}
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            aria-pressed={showAll}
            className={cn(
              'flex min-h-10 items-center gap-1.5 rounded-full border px-4 text-[13px] font-semibold transition',
              showAll
                ? 'border-brand-soft/60 bg-brand/15 text-ink shadow-[0_0_18px_rgba(139,92,246,0.3)]'
                : 'border-line bg-white/3 text-muted hover:text-ink',
            )}
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            All templates
          </button>
        </div>
      )}

      {!templates ? (
        <LoadingScreen fullscreen={false} label="Loading templates…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={wizard.templateId === t.id}
              onSelect={() => {
                applyTemplate(t)
                if (t.occasion !== wizard.occasion) patch({ occasion: t.occasion })
              }}
            />
          ))}
        </div>
      )}
    </WizardShell>
  )
}
