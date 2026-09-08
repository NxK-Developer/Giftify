import { useState } from 'react'
import { UserRound, Gauge, Accessibility, Database, Info, Trash2, Save } from 'lucide-react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import GlassCard from '@/components/common/GlassCard'
import Button from '@/components/common/Button'
import Modal from '@/components/common/Modal'
import Toggle from '@/components/common/Toggle'
import Badge from '@/components/common/Badge'
import { Input, Select } from '@/components/common/Input'
import { useAuth } from '@/store/AuthContext'
import { useSettings, type PerfMode } from '@/store/SettingsContext'
import { useToast } from '@/store/ToastContext'
import { useSeo } from '@/hooks/useSeo'
import { musicService } from '@/services/musicService'
import { updateDisplayName } from '@/services/userService'
import { setLocalDemoDisplayName } from '@/services/authService'
import { clearDraft } from '@/services/draftService'
import { isFirebaseConfigured } from '@/lib/env'
import { STORAGE_KEYS } from '@/constants/limits'
import { removeKey } from '@/utils/storage'
import { BRAND } from '@/constants/brand'
import { sanitizeLine } from '@/utils/sanitize'
import { LIMITS } from '@/constants/limits'
import type { PerfTier } from '@/types'

const PERF_OPTIONS: { value: PerfMode; label: string }[] = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'high', label: 'High — full particles & glow' },
  { value: 'medium', label: 'Medium — balanced' },
  { value: 'low', label: 'Low — battery & data friendly' },
]

export default function SettingsPage() {
  useSeo({
    title: 'Settings — NxK Greetings',
    description: 'Profile, performance mode, reduced motion, volume and local data controls.',
    canonicalPath: '/dashboard/settings',
    noindex: true,
  })
  const { session, profile, isDemoMode, refreshProfile } = useAuth()
  const settings = useSettings()
  const { pushToast } = useToast()

  const [name, setName] = useState(session?.displayName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [confirmClearDraft, setConfirmClearDraft] = useState(false)
  const [confirmClearLocal, setConfirmClearLocal] = useState(false)

  const saveName = async () => {
    const clean = sanitizeLine(name, LIMITS.displayName.max)
    setSavingName(true)
    try {
      if (isDemoMode) {
        setLocalDemoDisplayName(clean)
        pushToast('success', 'Name updated', 'Demo identity renamed on this device.')
      } else if (session) {
        await updateDisplayName(session.uid, clean)
        await refreshProfile()
        pushToast('success', 'Name updated', 'Your profile is up to date.')
      }
    } catch {
      pushToast('error', 'Couldn’t save your name', 'Check your connection and retry.')
    } finally {
      setSavingName(false)
    }
  }

  const clearLocalGreetings = () => {
    removeKey(STORAGE_KEYS.demoGreetings)
    pushToast('success', 'On-device greetings cleared', 'Demo/local greetings were removed from this browser.')
    setConfirmClearLocal(false)
  }

  const tierLabel: Record<PerfTier, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }

  return (
    <DashboardLayout>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-muted">Profile, experience quality and your on-device data.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <UserRound className="size-4 text-brand-soft" aria-hidden="true" />
            Profile
          </h2>
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {isDemoMode ? (
                <Badge tone="amber">Demo identity · on-device</Badge>
              ) : session?.isAnonymous ? (
                <Badge tone="cyan">Guest session (anonymous)</Badge>
              ) : (
                <Badge tone="green">Signed in</Badge>
              )}
              {profile?.role === 'admin' && <Badge tone="violet">Admin</Badge>}
            </div>
            <Input
              label="Display name"
              value={name}
              maxLength={LIMITS.displayName.max + 5}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              counter={{ current: sanitizeLine(name, 99).length, max: LIMITS.displayName.max }}
            />
            {!isDemoMode && session?.email && (
              <p className="text-xs text-muted">
                Email: <span className="font-semibold text-ink-dim">{session.email}</span> (managed by Firebase
                Authentication)
              </p>
            )}
            <div className="flex gap-2">
              <Button size="md" onClick={saveName} loading={savingName} icon={<Save className="size-4" />}>
                Save name
              </Button>
              {session?.isAnonymous && isFirebaseConfigured && (
                <Button size="md" variant="secondary" to="/signup">
                  Create full account
                </Button>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Experience */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Gauge className="size-4 text-neon" aria-hidden="true" />
            Experience & performance
          </h2>
          <div className="mt-4 space-y-5">
            <Select
              label="Performance mode"
              value={settings.perfMode}
              onChange={(e) => settings.setPerfMode(e.target.value as PerfMode)}
              options={PERF_OPTIONS}
              hint={`Auto-detected on this device: ${tierLabel[settings.tier]} tier (particle counts and effects adapt automatically).`}
            />
            <Toggle
              checked={settings.reducedMotionOverride === true}
              onChange={(on) => settings.setReducedMotionOverride(on ? true : null)}
              label="Force reduced motion"
              description={
                settings.systemReducedMotion
                  ? 'Your system already requests reduced motion — animations are simplified automatically.'
                  : 'Simplifies transitions and minimizes particle motion everywhere.'
              }
            />
            <div>
              <label htmlFor="settings-volume" className="mb-1.5 block text-[13px] font-semibold text-ink-dim">
                Default music volume · {Math.round(settings.volume * 100)}%
              </label>
              <div className="flex items-center gap-3">
                <Accessibility className="size-4 shrink-0 text-muted" aria-hidden="true" />
                <input
                  id="settings-volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    settings.setVolume(v)
                    musicService.setVolume(v)
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[linear-gradient(135deg,#8b5cf6,#ec4899)]"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Data */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Database className="size-4 text-gold" aria-hidden="true" />
            Data on this device
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/3 p-4">
              <div>
                <p className="text-sm font-semibold text-ink">Creator draft</p>
                <p className="mt-0.5 text-[11.5px] text-muted">Autosaved wizard progress (never includes your password).</p>
              </div>
              <Button variant="secondary" size="sm" icon={<Trash2 className="size-3.5" />} onClick={() => setConfirmClearDraft(true)}>
                Clear
              </Button>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/3 p-4">
              <div>
                <p className="text-sm font-semibold text-ink">On-device greetings</p>
                <p className="mt-0.5 text-[11.5px] text-muted">
                  {isFirebaseConfigured
                    ? 'Demo/fallback greetings stored in this browser (cloud greetings live in Firestore and are untouched).'
                    : 'In Demo Mode all greetings live here. Clearing removes them permanently.'}
                </p>
              </div>
              <Button variant="secondary" size="sm" icon={<Trash2 className="size-3.5" />} onClick={() => setConfirmClearLocal(true)}>
                Clear
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* About */}
        <GlassCard className="p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
            <Info className="size-4 text-accent-soft" aria-hidden="true" />
            About
          </h2>
          <dl className="mt-4 space-y-2.5 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">App</dt>
              <dd className="font-semibold text-ink-dim">{BRAND.app} v{BRAND.version}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Backend</dt>
              <dd className="font-semibold text-ink-dim">
                {isFirebaseConfigured ? 'Firebase Auth + Firestore' : 'Demo Mode (on-device)'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Storage used</dt>
              <dd className="font-semibold text-ink-dim">None in v1 — config only (media is a future feature)</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Built by</dt>
              <dd className="font-semibold text-ink-dim">
                {BRAND.name} · {BRAND.founder} & {BRAND.coFounder}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[11px] leading-relaxed text-muted">
            Music is generated live with the Web Audio API, QR codes render locally, and all animations are
            procedural canvas/CSS — zero paid services, zero trackers.
          </p>
        </GlassCard>
      </div>

      {/* Confirm modals */}
      <Modal
        open={confirmClearDraft}
        onClose={() => setConfirmClearDraft(false)}
        title="Clear your draft?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClearDraft(false)}>Keep it</Button>
            <Button
              variant="danger"
              onClick={() => {
                clearDraft()
                setConfirmClearDraft(false)
                pushToast('success', 'Draft cleared', 'The wizard will start fresh next time.')
              }}
            >
              Clear draft
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Your in-progress greeting choices (occasion, names, message, theme…) will be removed from this
          browser. Generated greetings are not affected.
        </p>
      </Modal>

      <Modal
        open={confirmClearLocal}
        onClose={() => setConfirmClearLocal(false)}
        title="Clear on-device greetings?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClearLocal(false)}>Keep them</Button>
            <Button variant="danger" onClick={clearLocalGreetings}>Clear everything</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          This permanently removes demo/local greetings from this browser — their links will stop working here.
          {isFirebaseConfigured && ' Cloud greetings (Firestore) are not touched.'}
        </p>
      </Modal>
    </DashboardLayout>
  )
}
