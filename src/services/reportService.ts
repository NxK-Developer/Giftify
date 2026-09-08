import type { ReportReason } from '@/types'
import { isFirebaseConfigured } from '@/lib/env'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'
import { STORAGE_KEYS, RATE_LIMITS, LIMITS } from '@/constants/limits'
import { readJSON, writeJSON } from '@/utils/storage'
import { sanitizeMultiline } from '@/utils/sanitize'

/**
 * reportService — "Report Greeting" abuse system.
 * Reports are written to `reports/{id}` with a whitelisted reason and size-
 * capped details. Reporter identity is stored ONLY as a uid (or null for
 * anonymous) and is readable exclusively by admins — never exposed publicly.
 * A client-side cooldown complements the size/rate protection in rules.
 */

export class ReportError extends Error {}

export const REPORT_REASONS: { id: ReportReason; label: string; description: string }[] = [
  { id: 'spam', label: 'Spam', description: 'Unsolicited or repetitive junk content' },
  { id: 'harassment', label: 'Harassment', description: 'Targeting or bullying a person' },
  { id: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive, adult or hateful material' },
  { id: 'abuse', label: 'Abuse', description: 'Threats, scams or illegal activity' },
  { id: 'other', label: 'Other', description: 'Something else worth reviewing' },
]

export async function submitReport(params: {
  greetingId: string
  reason: ReportReason
  details?: string
  reporterUid?: string | null
}): Promise<void> {
  if (!isFirebaseConfigured) {
    throw new ReportError(
      'Reporting needs the live backend. This session is in Demo Mode, so there is nothing to moderate.',
    )
  }
  const now = Date.now()
  const last = readJSON<number>(STORAGE_KEYS.lastReportAt, 0)
  if (now - last < RATE_LIMITS.minReportIntervalMs) {
    const wait = Math.ceil((RATE_LIMITS.minReportIntervalMs - (now - last)) / 1000)
    throw new ReportError(`Please wait ${wait}s before submitting another report.`)
  }

  const details = sanitizeMultiline(params.details ?? '', LIMITS.reportDetails.max)
  try {
    const { db } = await getFirebase()
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
    await addDoc(collection(db, 'reports'), {
      greetingId: params.greetingId,
      reason: params.reason,
      details,
      reporterUid: params.reporterUid ?? null,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
    writeJSON(STORAGE_KEYS.lastReportAt, now)
  } catch (err) {
    throw new ReportError(friendlyFirebaseError(err))
  }
}
