import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers, Eye, EyeOff, RotateCcw, Search } from 'lucide-react'
import type { TemplateConfig } from '@/types'
import AdminLayout from '@/components/admin/AdminLayout'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import Toggle from '@/components/common/Toggle'
import { Input } from '@/components/common/Input'
import ErrorState from '@/components/common/ErrorState'
import LoadingScreen from '@/components/common/LoadingScreen'
import { useSeo } from '@/hooks/useSeo'
import { useToast } from '@/store/ToastContext'
import { allTemplates } from '@/services/templateService'
import { getTemplateOverrideMap, setTemplateEnabled } from '@/services/adminService'
import { getOccasion } from '@/constants/occasions'
import { getTheme } from '@/constants/themes'
import { ANIMATION_MAP } from '@/constants/animations'
import { MUSIC_MAP } from '@/constants/music'

type Overrides = Record<string, { enabled?: boolean }>

export default function AdminTemplatesPage() {
  useSeo({ title: 'Admin · Templates — NxK Greetings', noindex: true })
  const { pushToast } = useToast()
  const [overrides, setOverrides] = useState<Overrides | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyDisabled, setOnlyDisabled] = useState(false)

  const load = useCallback(() => {
    getTemplateOverrideMap()
      .then((next) => {
        setOverrides(next)
        setError(null)
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load template overrides.'),
      )
  }, [])

  useEffect(() => {
    void load()
  }, [load, reloadKey])

  const templates = useMemo(() => allTemplates(), [])

  const rows = useMemo(() => {
    if (!overrides) return []
    const q = search.trim().toLowerCase()
    return templates.filter((t) => {
      const enabled = overrides[t.id]?.enabled !== false
      if (onlyDisabled && enabled) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (getOccasion(t.occasion)?.name.toLowerCase().includes(q) ?? false)
      )
    })
  }, [templates, overrides, search, onlyDisabled])

  const disabledCount = useMemo(() => {
    if (!overrides) return 0
    return templates.filter((t) => overrides[t.id]?.enabled === false).length
  }, [templates, overrides])

  const toggle = async (t: TemplateConfig, enabled: boolean) => {
    setBusyId(t.id)
    try {
      await setTemplateEnabled(t.id, enabled)
      pushToast(
        'success',
        enabled ? 'Template re-enabled' : 'Template disabled',
        `${t.name} is now ${enabled ? 'visible to creators' : 'hidden from the template picker'}.`,
      )
      setReloadKey((k) => k + 1)
    } catch (err) {
      pushToast('error', 'Could not update template', err instanceof Error ? err.message : undefined)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout
      title="Templates"
      subtitle="Bundled template configs with live Firestore overrides. Disabling hides a template from creators instantly — no redeploy, and existing greetings keep working."
    >
      <div className="glass-card flex flex-wrap items-end gap-4 rounded-3xl p-5">
        <div className="min-w-52 flex-1">
          <Input
            label=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…"
            icon={<Search className="size-4" />}
            type="search"
          />
        </div>
        <Toggle
          checked={onlyDisabled}
          onChange={setOnlyDisabled}
          label={`Only disabled (${disabledCount})`}
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted">
          <Layers className="size-4 text-brand-soft" aria-hidden="true" />
          {overrides ? `${templates.length} bundled · ${templates.length - disabledCount} live` : 'loading…'}
        </div>
      </div>

      <div className="mt-5">
        {error ? (
          <ErrorState message={error} onRetry={() => {
            setError(null)
            setReloadKey((k) => k + 1)
          }} />
        ) : !overrides ? (
          <LoadingScreen fullscreen={false} label="Loading templates…" />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {rows.map((t) => {
              const enabled = overrides[t.id]?.enabled !== false
              const occasion = getOccasion(t.occasion)
              const theme = getTheme(t.theme)
              const anim = ANIMATION_MAP[t.animation]
              const music = MUSIC_MAP[t.music]
              const overridden = t.id in overrides
              return (
                <li
                  key={t.id}
                  className={`glass-card rounded-3xl p-5 transition ${enabled ? '' : 'opacity-70'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xl" aria-hidden="true">{t.accentEmoji}</span>
                        <h3 className="font-display text-base font-bold text-ink">{t.name}</h3>
                        {t.featured && <Badge tone="violet">featured</Badge>}
                        <Badge tone={enabled ? 'green' : 'red'}>{enabled ? 'live' : 'disabled'}</Badge>
                        {overridden && <Badge tone="neutral">override</Badge>}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{t.description}</p>
                      <p className="mt-2 font-mono text-[11px] text-brand-soft/80">{t.id}</p>
                    </div>
                    <div className="shrink-0">
                      <Toggle
                        checked={enabled}
                        onChange={(next) => toggle(t, next)}
                        disabled={busyId === t.id}
                        label={enabled ? 'Enabled' : 'Disabled'}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <Badge tone="pink">{occasion ? `${occasion.emoji} ${occasion.name}` : t.occasion}</Badge>
                    <Badge tone="cyan">{theme ? theme.name : t.theme}</Badge>
                    <Badge tone="violet">{anim ? anim.name : t.animation}</Badge>
                    <Badge tone="amber">{music ? music.name : t.music}</Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={enabled ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      loading={busyId === t.id}
                      onClick={() => toggle(t, !enabled)}
                    >
                      {enabled ? 'Disable' : 'Enable'}
                    </Button>
                    {overridden && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<RotateCcw className="size-3.5" />}
                        disabled={busyId === t.id}
                        onClick={() => toggle(t, true)}
                      >
                        Reset to default
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
            {rows.length === 0 && (
              <li className="col-span-full rounded-3xl border border-line bg-white/2 px-6 py-12 text-center text-sm text-muted">
                No templates match those filters.
              </li>
            )}
          </ul>
        )}
      </div>

      <p className="mt-6 max-w-2xl text-xs leading-relaxed text-muted">
        Template definitions (text, theme, animation, music) live in the app bundle as typed config — this
        page only flips the <code className="font-mono text-brand-soft">enabled</code> flag in{' '}
        <code className="font-mono text-brand-soft">templates/&lt;templateId&gt;</code>, so a bad template can be
        pulled in seconds while every greeting already created from it keeps playing.
      </p>
    </AdminLayout>
  )
}
