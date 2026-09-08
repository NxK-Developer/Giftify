import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Square, Volume2, Info } from 'lucide-react'
import WizardShell from '@/components/creator/WizardShell'
import GlassCard from '@/components/common/GlassCard'
import { ALL_MUSIC_OPTIONS } from '@/constants/music'
import { musicService } from '@/services/musicService'
import { useCreator } from '@/store/CreatorContext'
import { useSettings } from '@/store/SettingsContext'
import { useSeo } from '@/hooks/useSeo'
import { cn } from '@/utils/cn'

/**
 * Music step — six options including "No Music".
 * Tracks are generated live by the Web Audio engine (royalty-free by
 * construction). Previews start from a real user gesture, honoring browser
 * autoplay policy — we never try to bypass it.
 */
export default function MusicPage() {
  useSeo({
    title: 'Choose the Soundtrack — NxK Greetings',
    description: 'Dreamy, romantic, calm, celebration, emotional or silence — generative royalty-free soundtracks composed in the browser.',
    canonicalPath: '/music',
  })
  const { wizard, patch } = useCreator()
  const { volume, setVolume } = useSettings()
  const navigate = useNavigate()
  const [previewing, setPreviewing] = useState<string | null>(null)

  // Keep engine volume in sync with user settings
  useEffect(() => {
    musicService.setVolume(volume)
  }, [volume])

  // Stop any preview when leaving the step
  useEffect(() => {
    return () => {
      musicService.stop()
    }
  }, [])

  const togglePreview = (id: string) => {
    if (previewing === id) {
      musicService.stop()
      setPreviewing(null)
    } else {
      patch({ music: id as typeof wizard.music })
      musicService.play(id as typeof wizard.music)
      setPreviewing(id)
    }
  }

  const supported = musicService.supported

  return (
    <WizardShell
      step="music"
      title="Set the mood 🎵"
      subtitle="Soundtracks are composed live in the browser — royalty-free, offline-ready and never the same twice."
      onNext={() => {
        musicService.stop()
        navigate('/preview')
      }}
      nextLabel="Preview the experience"
      footerNote={supported ? undefined : 'Web Audio is unavailable on this browser — the greeting will play silently'}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
        {ALL_MUSIC_OPTIONS.map((m) => {
          const selected = wizard.music === m.id
          const isPreviewing = previewing === m.id
          const playable = m.id !== 'none' && supported
          return (
            <div
              key={m.id}
              role="option"
              aria-selected={selected}
              tabIndex={0}
              onClick={() => {
                patch({ music: m.id })
                if (m.id === 'none') {
                  musicService.stop()
                  setPreviewing(null)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  patch({ music: m.id })
                }
              }}
              className={cn(
                'glass-card group relative flex cursor-pointer flex-col p-5 transition-all duration-300 press',
                selected
                  ? '-translate-y-0.5 neon-border shadow-[0_0_48px_-10px_rgba(167,139,250,0.6)]'
                  : 'hover:-translate-y-0.5 hover:border-white/20',
              )}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl border text-2xl transition-transform group-hover:scale-110',
                    selected ? 'border-brand-soft/60 bg-brand/15' : 'border-line bg-white/4',
                    isPreviewing && 'animate-heartbeat',
                  )}
                  aria-hidden="true"
                >
                  {m.emoji}
                </span>
                <div className="flex items-center gap-2">
                  {playable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePreview(m.id)
                      }}
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full border transition',
                        isPreviewing
                          ? 'border-accent/60 bg-accent/15 text-accent-soft'
                          : 'border-line bg-white/5 text-ink-dim hover:border-brand-soft/50 hover:text-ink',
                      )}
                      aria-label={isPreviewing ? `Stop ${m.name} preview` : `Preview ${m.name}`}
                    >
                      {isPreviewing ? <Square className="size-3.5 fill-current" /> : <Play className="size-4 fill-current" />}
                    </button>
                  )}
                  {selected && (
                    <span className="flex size-6 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] text-[11px] font-bold text-white">
                      ✓
                    </span>
                  )}
                </div>
              </div>
              <h3 className="mt-3.5 font-display text-[15px] font-bold text-ink">{m.name}</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{m.description}</p>
              {m.tempo > 0 && (
                <p className="mt-3 font-mono text-[10px] tracking-widest text-muted/70 uppercase">
                  {m.tempo} bpm · {m.progression.length}-chord loop · live synthesis
                </p>
              )}
              {/* equalizer bars while previewing */}
              {isPreviewing && (
                <div className="mt-3 flex h-4 items-end gap-1" aria-hidden="true">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 rounded-full bg-[linear-gradient(180deg,#a78bfa,#ec4899)]"
                      style={{
                        height: `${6 + ((i * 7) % 11)}px`,
                        animation: `float ${0.6 + (i % 4) * 0.18}s ease-in-out ${i * 0.07}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Volume */}
      <GlassCard className="mt-6 p-5">
        <label htmlFor="music-volume" className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <Volume2 className="size-4 text-brand-soft" aria-hidden="true" />
          Default volume
          <span className="ml-auto font-mono text-xs text-muted tabular-nums">{Math.round(volume * 100)}%</span>
        </label>
        <input
          id="music-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
            musicService.setVolume(v)
          }}
          className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-brand [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[linear-gradient(135deg,#8b5cf6,#ec4899)] [&::-webkit-slider-thumb]:shadow-[0_0_14px_rgba(236,72,153,0.6)]"
        />
        <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
          <Info className="mt-0.5 size-3.5 shrink-0 text-neon" aria-hidden="true" />
          Browsers require a tap before audio can play — that’s why every greeting starts with “Tap to begin”.
          Recipients always get play/pause, mute and volume controls.
        </p>
      </GlassCard>
    </WizardShell>
  )
}
