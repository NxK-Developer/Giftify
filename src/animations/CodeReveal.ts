/**
 * CodeReveal — timing controller for the cinematic terminal intro.
 *
 * This drives the "code intro" sequence the recipient sees first:
 *   initializing surprise... → connecting... → loading memories...
 *   → compiling emotions... → preparing something special... → access granted
 *
 * It is a pure logic class (no DOM): the TerminalIntro React component
 * renders whatever state it emits. Pause/resume/skip are exact — timings are
 * timestamp-based, and reduced-motion collapses the typing to instant lines.
 *
 * This is a *visual effect*. It never touches networks, systems or data —
 * it only types pre-written lines on screen.
 */

export interface CodeLine {
  text: string
  /** Characters currently visible (=== text.length when done) */
  typed: number
  done: boolean
  /** 'granted' lines render with special styling */
  kind: 'normal' | 'granted'
}

export interface CodeRevealState {
  lines: CodeLine[]
  finished: boolean
  /** Overall progress 0..1 for progress indicators */
  progress: number
}

export interface CodeRevealOptions {
  lines: string[]
  msPerChar?: number
  lineDelayMs?: number
  reducedMotion?: boolean
  onState: (state: CodeRevealState) => void
  onComplete: () => void
}

export class CodeReveal {
  private options: Required<Omit<CodeRevealOptions, 'onState' | 'onComplete'>> &
    Pick<CodeRevealOptions, 'onState' | 'onComplete'>
  private state: CodeLine[]
  private lineIndex = 0
  private charIndex = 0
  private timer: number | null = null
  private destroyed = false
  private paused = false
  private finished = false
  /** Timestamp-based scheduling for exact pause/resume */
  private nextTickAt = 0
  private remainingDelay = 0

  constructor(options: CodeRevealOptions) {
    this.options = {
      lines: options.lines,
      msPerChar: options.msPerChar ?? 34,
      lineDelayMs: options.lineDelayMs ?? 420,
      reducedMotion: options.reducedMotion ?? false,
      onState: options.onState,
      onComplete: options.onComplete,
    }
    this.state = options.lines.map((text) => ({
      text,
      typed: 0,
      done: false,
      kind: text.includes('granted') ? 'granted' : 'normal',
    }))
  }

  start(): void {
    if (this.destroyed || this.options.reducedMotion) {
      // Reduced motion: show all lines instantly, then finish.
      this.state = this.state.map((l) => ({ ...l, typed: l.text.length, done: true }))
      this.emit()
      this.timer = window.setTimeout(() => this.finish(), 900)
      return
    }
    this.schedule(this.tick, this.options.msPerChar)
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
    if (!this.paused || this.destroyed) return
    this.paused = false
    this.schedule(this.tick, this.remainingDelay || this.options.msPerChar)
  }

  skip(): void {
    this.finish()
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

    if (this.lineIndex >= this.state.length) {
      this.finish()
      return
    }

    const line = this.state[this.lineIndex]
    if (!line) {
      this.finish()
      return
    }

    if (line.typed < line.text.length) {
      line.typed++
      this.emit()
      // Vary typing speed slightly for realism; pause at ellipses.
      const char = line.text[line.typed - 1]
      const delay =
        char === '.' ? this.options.msPerChar * 5 : this.options.msPerChar + Math.random() * 26
      this.schedule(this.tick, delay)
    } else {
      line.done = true
      this.lineIndex++
      this.charIndex = 0
      this.emit()
      if (this.lineIndex >= this.state.length) {
        // Hold "access granted" for a beat before completing.
        this.schedule(this.tick, 1100)
      } else {
        this.schedule(this.tick, this.options.lineDelayMs)
      }
    }
  }

  private finish(): void {
    if (this.finished || this.destroyed) return
    this.finished = true
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
    this.state = this.state.map((l) => ({ ...l, typed: l.text.length, done: true }))
    this.emit()
    this.options.onComplete()
  }

  private emit(): void {
    const totalChars = this.state.reduce((sum, l) => sum + l.text.length, 0)
    const typedChars = this.state.reduce((sum, l) => sum + l.typed, 0)
    this.options.onState({
      lines: this.state.map((l) => ({ ...l })),
      finished: this.finished,
      progress: totalChars > 0 ? typedChars / totalChars : 0,
    })
  }

  /** Keep charIndex referenced for potential future per-char hooks. */
  getCharIndex(): number {
    return this.charIndex
  }
}
