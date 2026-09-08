import type { WizardState } from '@/types'
import { STORAGE_KEYS } from '@/constants/limits'
import { readJSON, writeJSON, removeKey } from '@/utils/storage'
import { sanitizeLine, sanitizeMultiline } from '@/utils/sanitize'
import { LIMITS } from '@/constants/limits'

/**
 * draftService — automatic LocalStorage draft saving.
 * The whole wizard state (occasion, template, recipient, sender, message,
 * theme, animation, music, privacy, schedule) is persisted on every change
 * and restored after refresh/crash. The password field is memory-only and
 * is deliberately never written to storage.
 */

export const EMPTY_WIZARD: WizardState = {
  occasion: null,
  templateId: null,
  recipientName: '',
  senderName: '',
  nickname: '',
  relationship: '',
  specialDate: '',
  message: '',
  theme: null,
  animation: null,
  music: 'dreamy',
  privacy: 'unlisted',
  scheduledAt: null,
  expiresAt: null,
  password: '',
}

type PersistedDraft = Omit<WizardState, 'password'> & { savedAt: string }

export function loadDraft(): WizardState | null {
  const raw = readJSON<PersistedDraft | null>(STORAGE_KEYS.draft, null)
  if (!raw || typeof raw !== 'object') return null
  const draft: WizardState = {
    ...EMPTY_WIZARD,
    occasion: raw.occasion ?? null,
    templateId: raw.templateId ?? null,
    recipientName: sanitizeLine(String(raw.recipientName ?? ''), LIMITS.recipientName.max),
    senderName: sanitizeLine(String(raw.senderName ?? ''), LIMITS.senderName.max),
    nickname: sanitizeLine(String(raw.nickname ?? ''), LIMITS.nickname.max),
    relationship: sanitizeLine(String(raw.relationship ?? ''), LIMITS.relationship.max),
    specialDate: typeof raw.specialDate === 'string' ? raw.specialDate.slice(0, 24) : '',
    message: sanitizeMultiline(String(raw.message ?? ''), LIMITS.message.max),
    theme: raw.theme ?? null,
    animation: raw.animation ?? null,
    music: raw.music ?? 'dreamy',
    privacy: raw.privacy ?? 'unlisted',
    scheduledAt: raw.scheduledAt ?? null,
    expiresAt: raw.expiresAt ?? null,
    password: '', // never persisted
  }
  // Nothing meaningful saved? Treat as no draft.
  const meaningful =
    draft.occasion || draft.templateId || draft.recipientName || draft.message || draft.theme
  return meaningful ? draft : null
}

export function saveDraft(state: WizardState): void {
  const { password: _password, ...rest } = state
  const persisted: PersistedDraft = { ...rest, savedAt: new Date().toISOString() }
  writeJSON(STORAGE_KEYS.draft, persisted)
}

export function clearDraft(): void {
  removeKey(STORAGE_KEYS.draft)
}

export function draftSavedAt(): string | null {
  const raw = readJSON<PersistedDraft | null>(STORAGE_KEYS.draft, null)
  return raw?.savedAt ?? null
}
