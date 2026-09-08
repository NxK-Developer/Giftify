import { useState } from 'react'
import { Pause, Play, Music, Music2, VolumeX, Volume2, RotateCcw, X } from 'lucide-react'
import type { ExperienceStage } from '@/types'
import type { MusicState } from '@/services/musicService'
import { cn } from '@/utils/cn'

export interface RecipientControlsProps {
  stage: ExperienceStage
  stageIndex: number
  totalStages: number
  paused: boolean
  onTogglePause: () => void
  onReplay: () => void
  music: MusicState
  hasTrack: boolean
  onToggleMusic: () => void
  onToggleMute: () => void
  onVolume: (v: number) => void
  onExit?: () => void
}

/**
 * The recipient's control cluster: progress dots, pause/resume, music
 * (play/mute/volume), replay — always reachable, never intrusive.
 */
export default function RecipientControls({
  stageIndex,
  totalStages,
  paused,
  onTogglePause,
  onReplay,
  music,
  hasTrack,
  onToggleMusic,
  onToggleMute,
  onVolume,
  onExit,
}: RecipientControlsProps) {
  const [volumeOpen, setVolumeOpen] = useState(false)

  const controlBtn =
    'flex size-11 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white/85 backdrop-blur transition hover:bg-white/12 hover:text-white press'

  return (
    <>
      {onExit && (
        <button type="button" onClick={onExit} className={cn(controlBtn, 'absolute right-4 top-4 z-40')} aria-label="Exit preview">
          <X className="size-4.5" aria-hidden="true" />
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center gap-2.5 px-4 safe-bottom">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={totalStages} aria-valuenow={stageIndex + 1} aria-label="Experience progress">
          {Array.from({ length: totalStages }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i === stageIndex ? 'w-6 bg-[linear-gradient(90deg,#a78bfa,#f472b6)] shadow-[0_0_10px_rgba(244,114,182,0.7)]' : i < stageIndex ? 'w-1.5 bg-white/45' : 'w-1.5 bg-white/15',
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={onTogglePause} className={controlBtn} aria-label={paused ? 'Resume experience' : 'Pause experience'}>
            {paused ? <Play className="size-4.5 fill-current" aria-hidden="true" /> : <Pause className="size-4.5 fill-current" aria-hidden="true" />}
          </button>

          {hasTrack && music.supported && (
            <>
              <button type="button" onClick={onToggleMusic} className={controlBtn} aria-label={music.playing ? 'Pause music' : 'Play music'}>
                {music.playing ? <Music2 className="size-4.5 text-accent-soft" aria-hidden="true" /> : <Music className="size-4.5" aria-hidden="true" />}
              </button>
              <button type="button" onClick={onToggleMute} className={controlBtn} aria-label={music.muted ? 'Unmute music' : 'Mute music'}>
                {music.muted ? <VolumeX className="size-4.5" aria-hidden="true" /> : <Volume2 className="size-4.5" aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setVolumeOpen((o) => !o)}
                className={cn(controlBtn, 'w-auto px-3.5 text-xs font-bold')}
                aria-expanded={volumeOpen}
                aria-label="Adjust volume"
              >
                {Math.round(music.volume * 100)}
              </button>
            </>
          )}

          <button type="button" onClick={onReplay} className={controlBtn} aria-label="Replay experience from the start">
            <RotateCcw className="size-4.5" aria-hidden="true" />
          </button>
        </div>

        {/* Volume slider popover */}
        {volumeOpen && hasTrack && (
          <div className="glass-strong mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 animate-scale-in">
            <Volume2 className="size-4 shrink-0 text-white/70" aria-hidden="true" />
            <label htmlFor="recipient-volume" className="sr-only">Volume</label>
            <input
              id="recipient-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={music.volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="h-1.5 w-40 cursor-pointer appearance-none rounded-full bg-white/15 accent-accent [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,255,255,0.7)]"
            />
          </div>
        )}
      </div>
    </>
  )
}
