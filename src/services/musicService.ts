import type { MusicTrackConfig, MusicTrackId } from '@/types'
import { getMusic } from '@/constants/music'

/**
 * musicService — a generative, procedural music engine built on the Web
 * Audio API. Every "track" is composed live in the browser from the score
 * data in constants/music.ts (tempo, chord progression, timbre).
 *
 * Why generative?
 *  - Truly royalty-free: the audio is synthesized, not sampled from anyone.
 *  - ₹0 cost, zero network, zero storage, works offline (PWA friendly).
 *  - Tiny bundle: a few KB of score data instead of megabytes of MP3s.
 *
 * Autoplay policy: AudioContext is only created/resumed inside play(), which
 * the UI always calls from a user gesture ("Tap to Start", preview button).
 * We never attempt to bypass browser autoplay restrictions.
 */

export interface MusicState {
  trackId: MusicTrackId | null
  playing: boolean
  volume: number
  muted: boolean
  supported: boolean
}

type Listener = (state: MusicState) => void

/** MIDI note → frequency */
function freq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const QUALITY_INTERVALS: Record<MusicTrackConfig['progression'][number]['quality'], number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  sus2: [0, 2, 7],
}

const STEPS_PER_BAR = 16 // sixteenth notes
const LOOKAHEAD_MS = 40
const SCHEDULE_AHEAD_S = 0.14

class MusicEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private reverb: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private comp: DynamicsCompressorNode | null = null

  private track: MusicTrackConfig | null = null
  private playing = false
  private timer: number | null = null
  private nextStepTime = 0
  private step = 0
  private volume = 0.72
  private muted = false
  private listeners = new Set<Listener>()

  get supported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext)
    )
  }

  getState(): MusicState {
    return {
      trackId: this.track?.id ?? null,
      playing: this.playing,
      volume: this.volume,
      muted: this.muted,
      supported: this.supported,
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    const state = this.getState()
    for (const l of this.listeners) l(state)
  }

  /* ---------------------------------------------------------------- */
  /* Audio graph                                                       */
  /* ---------------------------------------------------------------- */

  private ensureContext(): boolean {
    if (!this.supported) return false
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
      this.comp = this.ctx.createDynamicsCompressor()
      this.comp.threshold.value = -18
      this.comp.ratio.value = 6
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.reverb = this.ctx.createConvolver()
      this.reverb.buffer = this.makeReverbIR(this.ctx, 2.4, 2.6)
      this.reverbGain = this.ctx.createGain()
      this.reverbGain.gain.value = 0.9
      this.master.connect(this.comp)
      this.comp.connect(this.ctx.destination)
      this.reverb.connect(this.reverbGain)
      this.reverbGain.connect(this.comp)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return true
  }

  /** Procedurally generated impulse response — no asset files needed. */
  private makeReverbIR(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
    const rate = ctx.sampleRate
    const length = Math.max(1, Math.floor(rate * seconds))
    const buffer = ctx.createBuffer(2, length, rate)
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        const t = i / length
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - t * 0.15)
      }
    }
    return buffer
  }

  /* ---------------------------------------------------------------- */
  /* Transport                                                         */
  /* ---------------------------------------------------------------- */

  /** Must be called from a user gesture the first time. */
  play(trackId: MusicTrackId): void {
    if (trackId === 'none') {
      this.stop()
      return
    }
    if (!this.ensureContext() || !this.ctx || !this.master) return
    const track = getMusic(trackId)
    if (track.id === 'none') return

    if (this.track?.id !== track.id) {
      this.track = track
      this.step = 0
      this.nextStepTime = this.ctx.currentTime + 0.06
    }
    this.playing = true
    this.applyGain(0.9)
    if (this.timer === null) this.timer = window.setInterval(this.schedulerTick, LOOKAHEAD_MS)
    this.emit()
  }

  pause(): void {
    if (!this.playing) return
    this.playing = false
    this.applyGain(0, 0.35)
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    this.emit()
  }

  resume(): void {
    if (this.playing || !this.track || this.track.id === 'none') return
    if (!this.ensureContext() || !this.ctx) return
    this.playing = true
    this.nextStepTime = this.ctx.currentTime + 0.06
    this.applyGain(0.9)
    if (this.timer === null) this.timer = window.setInterval(this.schedulerTick, LOOKAHEAD_MS)
    this.emit()
  }

  stop(): void {
    this.playing = false
    if (this.timer !== null) {
      window.clearInterval(this.timer)
      this.timer = null
    }
    this.applyGain(0, 0.4)
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend()
    this.track = null
    this.emit()
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v))
    if (this.playing) this.applyGain(0.9, 0.08)
    this.emit()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.applyGain(muted ? 0 : 0.9, 0.12)
    this.emit()
  }

  private applyGain(target: number, ramp = 0.6): void {
    if (!this.ctx || !this.master) return
    const now = this.ctx.currentTime
    const g = this.master.gain
    const desired = target * this.volume * (this.muted ? 0 : 1)
    g.cancelScheduledValues(now)
    g.setValueAtTime(Math.max(g.value, 0.0001), now)
    g.linearRampToValueAtTime(Math.max(desired, 0.0001), now + ramp)
  }

  /* ---------------------------------------------------------------- */
  /* Scheduler (lookahead pattern — sample-accurate, main-thread safe) */
  /* ---------------------------------------------------------------- */

  private schedulerTick = (): void => {
    if (!this.ctx || !this.playing || !this.track) return
    while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD_S) {
      this.scheduleStep(this.step, this.nextStepTime, this.track)
      const secondsPerBeat = 60 / this.track.tempo
      this.nextStepTime += secondsPerBeat / 4 // sixteenth notes
      this.step = (this.step + 1) % (STEPS_PER_BAR * 4) // 4-bar loop
    }
  }

  private scheduleStep(step: number, time: number, track: MusicTrackConfig): void {
    const bar = Math.floor(step / STEPS_PER_BAR)
    const inBar = step % STEPS_PER_BAR
    const chord = track.progression[bar % track.progression.length]
    if (!chord) return
    const secondsPerBeat = 60 / track.tempo
    const barDur = secondsPerBeat * 4

    // Bass root on beats 1 & 3
    if (inBar === 0 || inBar === 8) {
      this.playNote({
        midi: 36 + chord.root,
        time,
        dur: secondsPerBeat * 1.8,
        wave: 'triangle',
        gain: 0.16,
        cutoff: 320,
        attack: 0.02,
        release: 0.5,
        reverbSend: 0.1,
      })
    }

    // Pad chord at the start of each bar (long, warm, layered)
    if (inBar === 0) {
      const intervals = QUALITY_INTERVALS[chord.quality]
      for (const iv of intervals) {
        this.playNote({
          midi: 52 + chord.root + iv,
          time,
          dur: barDur * 1.02,
          wave: track.timbre.padWave,
          gain: 0.052,
          cutoff: track.timbre.cutoffHz * 0.7,
          attack: 0.5,
          release: 0.9,
          reverbSend: track.timbre.reverbMix,
          detune: 5,
        })
      }
    }

    // Lead arpeggio / melody notes
    const density = track.timbre.density
    const isOnBeat = inBar % 4 === 0
    const probability = isOnBeat ? density : density * 0.45
    // Deterministic-ish pseudo random per step so loops feel intentional
    const seeded = Math.sin(step * 127.1 + bar * 311.7) * 43758.5453
    const rnd = seeded - Math.floor(seeded)
    if (rnd < probability && track.progression.length > 0) {
      const intervals = QUALITY_INTERVALS[chord.quality]
      const octaveJump = rnd > density * 0.85 ? 12 : 0
      const iv = intervals[Math.floor(rnd * intervals.length * 1.7) % intervals.length] ?? 0
      // Pentatonic color tones between chords
      const passing = rnd > 0.88 ? [2, 5, 9][Math.floor(rnd * 30) % 3] ?? 0 : 0
      this.playNote({
        midi: 60 + chord.root + iv + passing + octaveJump + (track.timbre.leadOctave - 1) * 12,
        time,
        dur: secondsPerBeat * (isOnBeat ? 1.1 : 0.55),
        wave: track.timbre.leadWave,
        gain: isOnBeat ? 0.11 : 0.07,
        cutoff: track.timbre.cutoffHz,
        attack: 0.012,
        release: 0.35,
        reverbSend: track.timbre.reverbMix * 0.9,
      })
    }

    // Celebration: soft noise hats on off-beat eighths
    if (track.id === 'celebration' && inBar % 4 === 2) {
      this.playHat(time, track.timbre.reverbMix * 0.3)
    }
  }

  private playNote(opts: {
    midi: number
    time: number
    dur: number
    wave: OscillatorType
    gain: number
    cutoff: number
    attack: number
    release: number
    reverbSend: number
    detune?: number
  }): void {
    const ctx = this.ctx
    const master = this.master
    const reverb = this.reverb
    if (!ctx || !master) return

    const osc = ctx.createOscillator()
    osc.type = opts.wave
    osc.frequency.value = freq(opts.midi)
    if (opts.detune) osc.detune.value = opts.detune

    // Second detuned voice for width on pads
    let osc2: OscillatorNode | null = null
    if (opts.detune) {
      osc2 = ctx.createOscillator()
      osc2.type = opts.wave
      osc2.frequency.value = freq(opts.midi)
      osc2.detune.value = -opts.detune
    }

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = opts.cutoff
    filter.Q.value = 0.7

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, opts.time)
    env.gain.linearRampToValueAtTime(opts.gain, opts.time + opts.attack)
    env.gain.setTargetAtTime(0.0001, opts.time + opts.attack + opts.dur * 0.6, opts.release / 3)

    const dry = ctx.createGain()
    dry.gain.value = 1 - opts.reverbSend * 0.5
    const wet = ctx.createGain()
    wet.gain.value = opts.reverbSend

    osc.connect(filter)
    osc2?.connect(filter)
    filter.connect(env)
    env.connect(dry)
    env.connect(wet)
    dry.connect(master)
    if (reverb) wet.connect(reverb)

    const stopAt = opts.time + opts.dur + opts.release * 2 + 0.2
    osc.start(opts.time)
    osc.stop(stopAt)
    if (osc2) {
      osc2.start(opts.time)
      osc2.stop(stopAt)
    }
    osc.onended = () => {
      osc.disconnect()
      osc2?.disconnect()
      filter.disconnect()
      env.disconnect()
      dry.disconnect()
      wet.disconnect()
    }
  }

  private playHat(time: number, reverbSend: number): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const dur = 0.05
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 7000
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.035, time)
    env.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    src.connect(hp)
    hp.connect(env)
    env.connect(master)
    if (this.reverb && reverbSend > 0.02) {
      const wet = ctx.createGain()
      wet.gain.value = reverbSend
      env.connect(wet)
      wet.connect(this.reverb)
    }
    src.start(time)
    src.stop(time + dur + 0.02)
  }
}

export const musicService = new MusicEngine()
