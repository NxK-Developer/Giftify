/**
 * Input sanitization. All user content is rendered through React text nodes
 * (never dangerouslySetInnerHTML), and these helpers keep stored data clean:
 * angle brackets and control characters are stripped at input time so even a
 * leaked raw document can't carry markup. No eval, no HTML parsing, ever.
 */

/** Remove control chars (except newline/tab), angle brackets and backticks. */
function stripDangerous(input: string, allowNewlines: boolean): string {
  let out = input.replace(/[<>`]/g, '')
  // eslint-disable-next-line no-control-regex
  out = out.replace(allowNewlines ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '')
  return out
}

/** Collapse repeated whitespace/newlines to sane limits. */
function collapseWhitespace(input: string, allowNewlines: boolean): string {
  let out = input.replace(/[ \t]+/g, ' ')
  if (allowNewlines) {
    out = out.replace(/\n{3,}/g, '\n\n')
  } else {
    out = out.replace(/\s*\n\s*/g, ' ')
  }
  return out.trim()
}

/** Sanitize a single-line field (names, nicknames, relationships). */
export function sanitizeLine(input: string, maxLength: number): string {
  if (typeof input !== 'string') return ''
  const cleaned = collapseWhitespace(stripDangerous(input, false), false)
  return cleaned.slice(0, maxLength)
}

/** Sanitize a multi-line field (messages). Keeps paragraph breaks. */
export function sanitizeMultiline(input: string, maxLength: number): string {
  if (typeof input !== 'string') return ''
  let cleaned = stripDangerous(input, true)
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  cleaned = collapseWhitespace(cleaned, true)
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength)
    // avoid cutting mid-line awkwardly
    const lastNewline = cleaned.lastIndexOf('\n')
    if (lastNewline > maxLength * 0.6) cleaned = cleaned.slice(0, lastNewline)
  }
  return cleaned
}

/** Emoji are valid text — count them as single characters for UX counters. */
export function countCharacters(input: string): number {
  return Array.from(input).length
}
