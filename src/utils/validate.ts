import { LIMITS } from '@/constants/limits'
import { OCCASION_MAP } from '@/constants/occasions'
import { THEME_MAP } from '@/constants/themes'
import { ANIMATION_MAP } from '@/constants/animations'
import { MUSIC_MAP } from '@/constants/music'
import { TEMPLATE_MAP } from '@/constants/templates'
import type { Greeting, WizardState } from '@/types'
import { countCharacters } from './sanitize'

export interface FieldIssue {
  field: keyof WizardState | string
  message: string
}

export function validateWizard(state: WizardState): FieldIssue[] {
  const issues: FieldIssue[] = []

  if (!state.occasion || !(state.occasion in OCCASION_MAP)) {
    issues.push({ field: 'occasion', message: 'Pick an occasion to continue' })
  }
  if (!state.templateId || !(state.templateId in TEMPLATE_MAP)) {
    issues.push({ field: 'templateId', message: 'Choose a template' })
  }

  const recipient = state.recipientName.trim()
  if (!recipient) {
    issues.push({ field: 'recipientName', message: 'Recipient name is required' })
  } else if (countCharacters(recipient) < LIMITS.recipientName.min) {
    issues.push({ field: 'recipientName', message: 'Recipient name is too short' })
  } else if (countCharacters(recipient) > LIMITS.recipientName.max) {
    issues.push({ field: 'recipientName', message: `Keep it under ${LIMITS.recipientName.max} characters` })
  }

  if (countCharacters(state.senderName.trim()) > LIMITS.senderName.max) {
    issues.push({ field: 'senderName', message: `Sender name max ${LIMITS.senderName.max} characters` })
  }
  if (countCharacters(state.nickname.trim()) > LIMITS.nickname.max) {
    issues.push({ field: 'nickname', message: `Nickname max ${LIMITS.nickname.max} characters` })
  }

  const message = state.message.trim()
  if (!message) {
    issues.push({ field: 'message', message: 'Write your message — it’s the heart of the surprise' })
  } else if (countCharacters(message) > LIMITS.message.max) {
    issues.push({ field: 'message', message: `Message max ${LIMITS.message.max} characters` })
  }

  if (!state.theme || !(state.theme in THEME_MAP)) {
    issues.push({ field: 'theme', message: 'Choose a theme' })
  }
  if (!state.animation || !(state.animation in ANIMATION_MAP)) {
    issues.push({ field: 'animation', message: 'Choose an animation style' })
  }
  if (!(state.music in MUSIC_MAP)) {
    issues.push({ field: 'music', message: 'Choose a music option' })
  }

  if (state.scheduledAt) {
    const t = new Date(state.scheduledAt).getTime()
    if (Number.isNaN(t)) {
      issues.push({ field: 'scheduledAt', message: 'Schedule date is invalid' })
    } else if (t < Date.now() - 60_000) {
      issues.push({ field: 'scheduledAt', message: 'Schedule time must be in the future' })
    }
  }
  if (state.expiresAt) {
    const t = new Date(state.expiresAt).getTime()
    if (Number.isNaN(t)) {
      issues.push({ field: 'expiresAt', message: 'Expiry date is invalid' })
    } else {
      const start = state.scheduledAt ? new Date(state.scheduledAt).getTime() : Date.now()
      if (t <= start) {
        issues.push({ field: 'expiresAt', message: 'Expiry must be after the start/schedule time' })
      }
    }
  }
  if (state.password && countCharacters(state.password) < LIMITS.password.min) {
    issues.push({ field: 'password', message: `Password needs at least ${LIMITS.password.min} characters` })
  }

  return issues
}

export function validateCredentials(email: string, password: string): FieldIssue[] {
  const issues: FieldIssue[] = []
  const trimmed = email.trim()
  if (!trimmed) issues.push({ field: 'email', message: 'Email is required' })
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed))
    issues.push({ field: 'email', message: 'Enter a valid email address' })
  if (!password) issues.push({ field: 'password', message: 'Password is required' })
  else if (password.length < 6)
    issues.push({ field: 'password', message: 'Password needs at least 6 characters' })
  return issues
}

/** Structural validation of a fetched greeting document (never trust remote data). */
export function isWellFormedGreeting(data: unknown): data is Greeting {
  if (typeof data !== 'object' || data === null) return false
  const g = data as Partial<Greeting>
  return (
    typeof g.id === 'string' &&
    g.id.length <= 24 &&
    typeof g.recipientName === 'string' &&
    g.recipientName.length <= 120 &&
    typeof g.senderName === 'string' &&
    g.senderName.length <= 120 &&
    typeof g.message === 'string' &&
    g.message.length <= 2000 &&
    typeof g.occasion === 'string' &&
    g.occasion in OCCASION_MAP &&
    typeof g.theme === 'string' &&
    g.theme in THEME_MAP &&
    typeof g.animation === 'string' &&
    g.animation in ANIMATION_MAP &&
    typeof g.music === 'string' &&
    g.music in MUSIC_MAP &&
    typeof g.privacy === 'string' &&
    ['public', 'unlisted', 'private'].includes(g.privacy) &&
    typeof g.views === 'number' &&
    typeof g.shares === 'number'
  )
}

/** Defensive re-sanitization of a greeting about to be rendered. */
export function normalizeGreeting(g: Greeting): Greeting {
  return {
    ...g,
    recipientName: g.recipientName.slice(0, LIMITS.recipientName.max + 20),
    senderName: (g.senderName ?? '').slice(0, LIMITS.senderName.max + 20),
    nickname: (g.nickname ?? '').slice(0, LIMITS.nickname.max + 10),
    relationship: (g.relationship ?? '').slice(0, LIMITS.relationship.max + 10),
    message: (g.message ?? '').slice(0, LIMITS.message.max + 200),
  }
}
