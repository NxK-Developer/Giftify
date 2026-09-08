/**
 * Typewriter — DOM-facing typewriter text controller (pure logic).
 * Used by the TypewriterText React component for message reveals.
 * Timestamp-based so pause/resume is exact; reduced-motion resolves
 * instantly via skip().
 */

export interface TypewriterOptions {
  text: string
  /** Milliseconds per character */
  msPerChar?: number
  /** Small pause after sentence punctuation */
  punctuationPauseMs?: number
  reducedMotion?: boolean
  onText: (partial: string) => void
  onProgress?: (ratio: number) => void
  onComplete: () => void
}

export class Typewriter {
  private options: TypewriterOptions
  private chars: string[]
  private index = 0
  private timer: number | null = null
  private destroyed = false
  private paused = false
  private finished = false
  private nextTickAt = 0
  private remainingDelay = 0

  constructor(options: TypewriterOptions) {
    this.options = {
      msPerChar: 26,
      punctuationPauseMs: 260,
      reducedMotion: false,
      ...options,
    }
    // Split by code points so emoji never tear in half.
    this.chars = Array.from(options.text)
  }

  start(): void {
    if (this.destroyed || this.finished) return
    if (this.options.reducedMotion) {
      this.skip()
      return
    }
    this.schedule(this.tick, this.options.msPerChar ?? 26)
  }

  pause(): void {
    if (this.paused || this.destroyed) return
    this.paused = true
    if (this.timer !== null) {
      window.clearTimeout(this.timer)
      this.timer = null
      this.remainingDelay = Math.max(0, this.nextTickAt - performance.now())
    }
  }

  resume(): void {
    if (!this.paused || this.destroyed || this.finished) return
    this.paused = false
    this.schedule(this.tick, this.remainingDelay || (this.options.msPerChar ?? 26))
  }

  skip(): void {
    if (this.destroyed || this.finished) return
    this.finished = true
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
    this.index = this.chars.length
    this.options.onText(this.options.text)
    this.options.onProgress?.(1)
    this.options.onComplete()
  }

  destroy(): void {
    this.destroyed = true
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
  }

  private schedule(fn: () => void, delayMs: number): void {
    this.nextTickAt = performance.now() + delayMs
    this.timer = window.setTimeout(fn, delayMs)
  }

  private tick = (): void => {
    if (this.destroyed || this.paused || this.finished) return
    this.timer = null
    if (this.index >= this.chars.length) {
      this.finished = true
      this.options.onProgress?.(1)
      this.options.onComplete()
      return
    }
    this.index++
    const partial = this.chars.slice(0, this.index).join('')
    this.options.onText(partial)
    this.options.onProgress?.(this.index / this.chars.length)

    const last = this.chars[this.index - 1] ?? ''
    const base = this.options.msPerChar ?? 26
    let delay = base + Math.random() * base * 0.7
    if ('.!?'.includes(last)) delay += this.options.punctuationPauseMs ?? 260
    else if (',;:—…'.includes(last)) delay += (this.options.punctuationPauseMs ?? 260) * 0.5
    this.schedule(this.tick, delay)
  }

  getProgress(): number {
    return this.chars.length > 0 ? this.index / this.chars.length : 1
  }
}
