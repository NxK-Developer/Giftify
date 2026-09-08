import { getAppUrl } from '@/lib/env'
import { getOccasion } from '@/constants/occasions'
import type { Greeting } from '@/types'

/**
 * shareService — Web Share API first, honest fallbacks second.
 * We never claim a platform supports "direct sharing" when it doesn't:
 * native share uses navigator.share only when available; platform buttons
 * use each platform's documented public intent URLs; Copy Link always works.
 */

export function buildGreetingUrl(id: string): string {
  return `${getAppUrl()}/g/${id}`
}

export function shareText(greeting: Pick<Greeting, 'recipientName' | 'occasion' | 'senderName'>): string {
  const occasion = getOccasion(greeting.occasion)
  const from = greeting.senderName ? ` from ${greeting.senderName}` : ''
  return `🎁 A cinematic ${occasion.name.toLowerCase()} surprise for ${greeting.recipientName}${from} ✨ Open it here:`
}

export function canNativeShare(url: string, text: string): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({ url, text }))
}

export type NativeShareResult = 'shared' | 'cancelled' | 'unavailable' | 'failed'

export async function nativeShare(url: string, text: string, title: string): Promise<NativeShareResult> {
  if (typeof navigator.share !== 'function') return 'unavailable'
  try {
    await navigator.share({ title, text, url })
    return 'shared'
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') return 'cancelled'
    return 'failed'
  }
}

/** Clipboard with graceful fallback for older Android WebViews. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** Documented public intent URLs — no APIs, no keys, no cost. */
export function platformShareLinks(url: string, text: string): Record<string, string> {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(text)
  return {
    whatsapp: `https://wa.me/?text=${t}%20${u}`,
    x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    email: `mailto:?subject=${encodeURIComponent('I made this for you ✨')}&body=${t}%0A%0A${u}`,
  }
}
