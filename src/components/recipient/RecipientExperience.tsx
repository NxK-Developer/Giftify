import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Gift, Sparkles } from 'lucide-react'
import type { ExperienceStage, Greeting } from '@/types'
import { getTheme } from '@/constants/themes'
import { getAnimationStyle } from '@/constants/animations'
import { getTemplate } from '@/constants/templates'
import { musicService, type MusicState } from '@/services/musicService'
import { FpsProbe } from '@/animations/perf'
import { StageTimer } from '@/utils/stageTimer'
import { useSettings } from '@/store/SettingsContext'
import ParticleBackground from '@/components/background/ParticleBackground'
import GradientBlobs from '@/components/background/GradientBlobs'
import NxKMonogram from '@/components/common/NxKMonogram'
import TerminalIntro from '@/components/animations/TerminalIntro'
import MatrixCanvas from '@/components/animations/MatrixCanvas'
import HeartCanvas from '@/components/animations/HeartCanvas'
import FlourishCanvas from '@/components/animations/FlourishCanvas'
import RecipientControls from './RecipientControls'
import { FinalScene, FlourishOverlay, MessageOverlay, NameOverlay } from './stages'
import type { HeartPhase } from '@/animations/HeartAnimation'
import { cn } from '@/utils/cn'

/**
 * RecipientExperience — the full-screen cinematic sequence:
 *
 *   Opening (tap) → Code Intro → Particles → Heart formation
 *   → Recipient name → Personal message → Special flourish → Final scene
 *
 * No navbar, no site chrome — just the surprise. Stage timing runs through
 * a pause-aware StageTimer; canvases pause with the tab and with the user's
 * pause button; reduced-motion collapses every effect to a calm variant.
 */

const STAGES: ExperienceStage[] = [
  'opening',
  'intro',
  'particles',
  'heart',
  'name',
  'message',
  'flourish',
  'final',
]

export interface RecipientExperienceProps {
  greeting: Greeting
  /** Creator preview: no analytics, shows an exit button */
  preview?: boolean
  /** Render inside a container (absolute) instead of the viewport (fixed) */
  contained?: boolean
  onExit?: () => void
  /** Fired once when the recipient taps to begin (used for view tracking) */
  onStarted?: () => void
  /** Share action on the final scene (hidden in preview) */
  onShare?: () => void
  shareUrl?: string | null
  canShareNatively?: boolean
}

export default function RecipientExperience({
  greeting,
  preview = false,
  contained = false,
  onExit,
  onStarted,
  onShare,
  shareUrl,
  canShareNatively = false,
}: RecipientExperienceProps) {
  const theme = useMemo(() => getTheme(greeting.theme), [greeting.theme])
  const animStyle = useMemo(() => getAnimationStyle(greeting.animation), [greeting.animation])
  const template = useMemo(() => getTemplate(greeting.templateId), [greeting.templateId])

  const { tier, reducedMotion, volume, reportFps, setVolume: setSettingsVolume } = useSettings()

  const [stage, setStage] = useState<ExperienceStage>('opening')
  const [paused, setPaused] = useState(false)
  const [heartPhase, setHeartPhase] = useState<HeartPhase>('float')
  const [musicState, setMusicState] = useState<MusicState>(() => musicService.getState())

  const timerRef = useRef<StageTimer | null>(null)
  const probeRef = useRef<FpsProbe | null>(null)
  const startedRef = useRef(false)
  const musicWasPlayingRef = useRef(false)
  const stageRef = useRef<ExperienceStage>('opening')
  useEffect(() => {
    stageRef.current = stage
  }, [stage])


  /* Keep music state mirrored for the controls */
  useEffect(() => musicService.subscribe(setMusicState), [])

  /* Stage timer lifecycle: created on mount, destroyed on unmount. */
  useEffect(() => {
    timerRef.current = new StageTimer()
    return () => {
      timerRef.current?.destroy()
      timerRef.current = null
      probeRef.current?.stop()
      musicService.stop()
    }
  }, [])

  const durations = useMemo(
    () => ({
      particles: reducedMotion ? 900 : 2300,
      heartHold: reducedMotion ? 1400 : 2600,
      name: reducedMotion ? 2200 : 4000,
      burstToMessage: reducedMotion ? 150 : 850,
      messageHold: reducedMotion ? 1000 : 2500,
      flourish: reducedMotion ? 1300 : 3400,
    }),
    [reducedMotion],
  )

  const enterStage = useCallback(
    (next: ExperienceStage) => {
      const timer = timerRef.current
      if (!timer) return
      setStage(next)
      switch (next) {
        case 'intro':
          // completion driven by TerminalIntro.onComplete
          break

        case 'particles':
          timer.schedule(() => {
            setHeartPhase('gather')
            setStage('heart')
          }, durations.particles)
          break
        case 'heart':
          // completion driven by HeartCanvas.onFormed
          break
        case 'name':
          timer.schedule(() => {
            setHeartPhase('burst')
            timer.schedule(() => setStage('message'), durations.burstToMessage)
          }, durations.name)
          break
        case 'message':
          // completion driven by typewriter onTyped
          break
        case 'flourish':
          timer.schedule(() => setStage('final'), durations.flourish)
          break
        case 'final':
          timer.cancel()
          break
        default:
          break
      }
    },
    [durations],
  )

  const handleIntroComplete = useCallback(() => enterStage('particles'), [enterStage])

  const handleHeartFormed = useCallback(() => {
    timerRef.current?.schedule(() => enterStage('name'), durations.heartHold)
  }, [enterStage, durations.heartHold])

  const handleMessageTyped = useCallback(() => {
    timerRef.current?.schedule(() => enterStage('flourish'), durations.messageHold)
  }, [enterStage, durations.messageHold])

  /* ------------------------------------------------ Opening tap -------- */

  const startExperience = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    onStarted?.()

    // Music can start now: this handler runs inside a real user gesture.
    musicService.setVolume(volume)
    if (greeting.music !== 'none') musicService.play(greeting.music)

    // Runtime FPS probe → refines 'auto' performance mode
    if (!reducedMotion) {
      probeRef.current?.stop()
      const probe = new FpsProbe()
      probeRef.current = probe
      probe.start(1600, (fps) => reportFps(fps))
    }

    enterStage(animStyle.showTerminal ? 'intro' : 'particles')
  }, [onStarted, volume, greeting.music, reducedMotion, reportFps, enterStage, animStyle.showTerminal])

  /* ------------------------------------------------ Pause / resume ----- */

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p
      if (next) {
        musicWasPlayingRef.current = musicService.getState().playing
        timerRef.current?.pause()
        if (musicWasPlayingRef.current) musicService.pause()
      } else {
        timerRef.current?.resume()
        if (musicWasPlayingRef.current && greeting.music !== 'none') musicService.resume()
      }
      return next
    })
  }, [greeting.music])

  /* ------------------------------------------------ Replay ------------- */

  const replay = useCallback(() => {
    timerRef.current?.cancel()
    setPaused(false)
    setHeartPhase('float')
    startedRef.current = true // audio already unlocked — no second tap gate
    enterStage(animStyle.showTerminal ? 'intro' : 'particles')
  }, [enterStage, animStyle.showTerminal])

  /* ------------------------------------------------ Music controls ----- */

  const toggleMusic = useCallback(() => {
    const state = musicService.getState()
    if (state.playing) musicService.pause()
    else if (greeting.music !== 'none') musicService.play(greeting.music)
  }, [greeting.music])

  const toggleMute = useCallback(() => {
    musicService.setMuted(!musicService.getState().muted)
  }, [])

  const changeVolume = useCallback(
    (v: number) => {
      musicService.setVolume(v)
      // Persist as the user's default for future greetings
      setSettingsVolume(v)
    },
    [setSettingsVolume],
  )

  /* ------------------------------------------------ Visual layers ------ */

  const particleIntensity =
    stage === 'opening'
      ? 0.4
      : stage === 'particles'
        ? 1.35
        : stage === 'heart' || stage === 'name'
          ? 0.45
          : stage === 'message'
            ? 0.7
            : 0.85

  const showMatrixRain = stage === 'intro' && animStyle.showTerminal
  const showHeart = stage === 'heart' || stage === 'name'
  const showFlourish = stage === 'flourish'

  const terminalAccent =
    theme.id === 'matrix' || animStyle.intro === 'matrix' ? 'text-matrix' : 'text-brand-soft'

  return (
    <div
      className={cn('overflow-hidden', contained ? 'absolute inset-0' : 'fixed inset-0')}
      style={{
        background: `radial-gradient(130% 110% at 50% -10%, ${theme.background[2]} 0%, ${theme.background[0]} 52%, ${theme.base} 100%)`,
      }}
      role="region"
      aria-label="Your personalized greeting experience"
    >
      {/* Ambient layers */}
      <GradientBlobs minimal />
      <ParticleBackground theme={theme} baseCount={120} intensity={particleIntensity} paused={paused || stage === 'opening'} />
      {showMatrixRain && (
        <MatrixCanvas
          theme={theme.id === 'matrix' ? theme : { ...theme, particleColors: theme.particleColors }}
          tier={tier}
          reducedMotion={reducedMotion}
          paused={paused}
          density={animStyle.intro === 'matrix' ? 1.3 : 0.85}
          speed={animStyle.intro === 'matrix' ? 1.5 : 0.9}
        />
      )}
      {showHeart && (
        <HeartCanvas
          theme={theme.id === 'heart' || theme.id === 'blossom' ? theme : { ...theme, accent: theme.accent2, particleColors: theme.particleColors }}
          tier={tier}
          reducedMotion={reducedMotion}
          paused={paused}
          phase={heartPhase}
          onFormed={handleHeartFormed}
        />
      )}
      {showFlourish && (
        <FlourishCanvas style={animStyle} theme={theme} tier={tier} reducedMotion={reducedMotion} paused={paused} />
      )}

      {/* Subtle brand watermark (never a navbar) */}
      <div className="absolute left-4 top-4 z-30 opacity-45" aria-hidden="true">
        <NxKMonogram size="xs" glow={false} />
      </div>

      {/* Stage overlays */}
      {stage === 'opening' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 px-6 text-center">
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-10 rounded-full blur-3xl animate-pulse-glow"
              style={{ background: theme.glow }}
            />
            <span
              className="relative flex size-24 items-center justify-center rounded-[2rem] border border-white/15 bg-black/30 text-5xl backdrop-blur animate-float"
              aria-hidden="true"
            >
              <Gift className="size-11 text-white" />
            </span>
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <p className="font-mono text-[10px] tracking-[0.35em] text-white/50 uppercase">
              A personal surprise awaits
            </p>
            <p className="mt-2 font-display text-lg font-bold text-white/90 sm:text-xl">
              For {greeting.nickname.trim() || greeting.recipientName} ✨
            </p>
          </div>
          <button
            type="button"
            onClick={startExperience}
            className="press group relative min-h-14 animate-fade-up rounded-full bg-[linear-gradient(120deg,#8b5cf6,#ec4899)] px-10 text-base font-bold text-white shadow-[0_14px_44px_-10px_rgba(236,72,153,0.7)] transition hover:brightness-110"
            style={{ animationDelay: '0.4s' }}
          >
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 blur-xl transition group-hover:opacity-100" aria-hidden="true" />
            <span className="relative flex items-center gap-2.5">
              <Sparkles className="size-5" aria-hidden="true" />
              Tap to Start Experience
            </span>
          </button>
          <p className="animate-fade-in text-[11px] text-white/45" style={{ animationDelay: '0.7s' }}>
            {greeting.music !== 'none' ? '🎵 sound on recommended · ' : ''}
            ~40 seconds · made just for you
          </p>
        </div>
      )}

      {stage === 'intro' && (
        <div className="absolute inset-0 z-20">
          <TerminalIntro
            onComplete={handleIntroComplete}
            paused={paused}
            accentClass={terminalAccent}
          />
        </div>
      )}

      {stage === 'particles' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center pb-[22vh]">
          <p className="animate-fade-in font-mono text-[11px] tracking-[0.3em] text-white/55 uppercase">
            something is forming…
          </p>
        </div>
      )}

      {stage === 'name' && <NameOverlay greeting={greeting} theme={theme} />}

      {stage === 'message' && (
        <MessageOverlay greeting={greeting} theme={theme} template={template} paused={paused} onTyped={handleMessageTyped} />
      )}

      {stage === 'flourish' && <FlourishOverlay greeting={greeting} theme={theme} template={template} />}

      {stage === 'final' && (
        <FinalScene
          greeting={greeting}
          theme={theme}
          template={template}
          onReplay={replay}
          onShare={onShare ?? (() => undefined)}
          shareUrl={shareUrl ?? null}
          canShareNatively={canShareNatively}
          preview={preview}
        />
      )}

      {/* Paused veil */}
      {paused && stage !== 'opening' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 backdrop-blur-[2px] animate-fade-in">
          <p className="font-display text-sm font-bold tracking-[0.3em] text-white/80 uppercase">Paused</p>
        </div>
      )}

      {/* Controls (after the opening tap) */}
      {stage !== 'opening' && (
        <RecipientControls
          stage={stage}
          stageIndex={STAGES.indexOf(stage)}
          totalStages={STAGES.length}
          paused={paused}
          onTogglePause={togglePause}
          onReplay={replay}
          music={musicState}
          hasTrack={greeting.music !== 'none'}
          onToggleMusic={toggleMusic}
          onToggleMute={toggleMute}
          onVolume={changeVolume}
          onExit={preview ? onExit : undefined}
        />
      )}

      {/* Screen-reader summary of what's happening (canvas content is aria-hidden) */}
      <p className="sr-only" role="status" aria-live="polite">
        {stage === 'opening' && 'A personalized greeting is ready to begin. Activate the start button to play the experience.'}
        {stage === 'intro' && 'A cinematic loading sequence is playing.'}
        {(stage === 'particles' || stage === 'heart') && 'Particles of light are gathering into a glowing heart.'}
        {stage === 'name' && `This greeting is for ${greeting.recipientName}.`}
        {stage === 'message' && greeting.message}
        {stage === 'flourish' && 'A celebratory animation is playing.'}
        {stage === 'final' && `The greeting is complete. ${greeting.message} Created with NxK Developer.`}
      </p>
    </div>
  )
}
