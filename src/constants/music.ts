import type { MusicTrackConfig, MusicTrackId } from '@/types'

/**
 * Music is generated procedurally in the browser with the Web Audio API
 * (see services/musicService.ts). This means:
 *  - 100% royalty-free (composed by the engine, not sampled from anyone)
 *  - ₹0 cost, zero bandwidth, works offline
 *  - No licensing or attribution risk, ever
 * Each track below is a *score*: tempo, chord progression and timbre data.
 */
export const MUSIC_TRACKS: MusicTrackConfig[] = [
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Floating pads and soft bells, like drifting through starlight',
    emoji: '☁️',
    tempo: 62,
    progression: [
      { root: 0, quality: 'maj7' }, // Cmaj7
      { root: 9, quality: 'min7' }, // Am7
      { root: 5, quality: 'maj7' }, // Fmaj7
      { root: 7, quality: 'maj' }, // G
    ],
    timbre: {
      padWave: 'triangle',
      leadWave: 'sine',
      cutoffHz: 1600,
      reverbMix: 0.55,
      leadOctave: 1,
      density: 0.5,
    },
  },
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Warm, slow and tender — made for love letters',
    emoji: '🌹',
    tempo: 66,
    progression: [
      { root: 2, quality: 'maj' }, // D
      { root: 9, quality: 'min7' }, // Am7 (as A-rooted passing chord)
      { root: 11, quality: 'min7' }, // Bm7
      { root: 7, quality: 'maj' }, // G→ use G major feel
    ],
    timbre: {
      padWave: 'sine',
      leadWave: 'triangle',
      cutoffHz: 1300,
      reverbMix: 0.6,
      leadOctave: 1,
      density: 0.42,
    },
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Quiet sustained chords and rare, gentle bells',
    emoji: '🍃',
    tempo: 54,
    progression: [
      { root: 5, quality: 'maj7' }, // Fmaj7
      { root: 4, quality: 'min7' }, // Em7
      { root: 2, quality: 'min7' }, // Dm7
      { root: 0, quality: 'maj7' }, // Cmaj7
    ],
    timbre: {
      padWave: 'sine',
      leadWave: 'sine',
      cutoffHz: 1100,
      reverbMix: 0.5,
      leadOctave: 1,
      density: 0.3,
    },
  },
  {
    id: 'celebration',
    name: 'Celebration',
    description: 'Bright, upbeat arpeggios with party sparkle',
    emoji: '🎉',
    tempo: 108,
    progression: [
      { root: 7, quality: 'maj' }, // G
      { root: 2, quality: 'maj' }, // D
      { root: 4, quality: 'min' }, // Em
      { root: 0, quality: 'maj' }, // C
    ],
    timbre: {
      padWave: 'triangle',
      leadWave: 'square',
      cutoffHz: 2600,
      reverbMix: 0.3,
      leadOctave: 2,
      density: 0.75,
    },
  },
  {
    id: 'emotional',
    name: 'Emotional',
    description: 'Slow minor-key piano-like plucks with deep warmth',
    emoji: '🎻',
    tempo: 58,
    progression: [
      { root: 9, quality: 'min' }, // Am
      { root: 5, quality: 'maj' }, // F
      { root: 0, quality: 'maj' }, // C
      { root: 7, quality: 'maj' }, // G
    ],
    timbre: {
      padWave: 'triangle',
      leadWave: 'triangle',
      cutoffHz: 1400,
      reverbMix: 0.5,
      leadOctave: 1,
      density: 0.45,
    },
  },
]

export const NO_MUSIC: MusicTrackConfig = {
  id: 'none',
  name: 'No Music',
  description: 'Pure silence — let the visuals and words speak',
  emoji: '🔇',
  tempo: 0,
  progression: [],
  timbre: {
    padWave: 'sine',
    leadWave: 'sine',
    cutoffHz: 1000,
    reverbMix: 0,
    leadOctave: 1,
    density: 0,
  },
}

export const ALL_MUSIC_OPTIONS: MusicTrackConfig[] = [...MUSIC_TRACKS, NO_MUSIC]

export const MUSIC_MAP: Record<MusicTrackId, MusicTrackConfig> = Object.fromEntries(
  ALL_MUSIC_OPTIONS.map((m) => [m.id, m]),
) as Record<MusicTrackId, MusicTrackConfig>

export const MUSIC_IDS: MusicTrackId[] = ALL_MUSIC_OPTIONS.map((m) => m.id)

export function getMusic(id: MusicTrackId | string | undefined | null): MusicTrackConfig {
  return MUSIC_MAP[(id ?? 'none') as MusicTrackId] ?? NO_MUSIC
}
