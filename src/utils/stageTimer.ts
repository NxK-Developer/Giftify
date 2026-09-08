/**
 * StageTimer — timestamp-based one-shot timer with exact pause/resume.
 * Drives the recipient experience stage machine; multiple timers can be
 * chained per stage. destroy() cancels everything (React cleanup safe).
 */
export class StageTimer {
  private timer: number | null = null
  private fn: (() => void) | null = null
  private dueAt = 0
  private paused = false
  private remaining = 0
  private destroyed = false

  schedule(fn: () => void, ms: number): void {
    this.cancel()
    if (this.destroyed) return
    this.fn = fn
    this.dueAt = performance.now() + ms
    this.timer = window.setTimeout(() => {
      this.timer = null
      const f = this.fn
      this.fn = null
      f?.()
    }, ms)
  }

  pause(): void {
    if (this.paused || this.destroyed || this.timer === null) {
      this.paused = true
      return
    }
    this.paused = true
    this.remaining = Math.max(0, this.dueAt - performance.now())
    window.clearTimeout(this.timer)
    this.timer = null
  }

  resume(): void {
    if (!this.paused || this.destroyed || !this.fn) return
    this.paused = false
    const fn = this.fn
    const ms = this.remaining
    this.schedule(fn, ms)
  }

  cancel(): void {
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = null
    this.fn = null
    this.remaining = 0
  }

  destroy(): void {
    this.destroyed = true
    this.cancel()
  }
}
