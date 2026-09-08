import type { Greeting, Report, ReportStatus, UserProfile, UserRole } from '@/types'
import { isFirebaseConfigured } from '@/lib/env'
import { getFirebase, friendlyFirebaseError } from '@/lib/firebase'

/**
 * adminService — admin panel data operations.
 *
 * Authorization model: a user is admin ONLY if `users/{uid}.role === 'admin'`
 * in Firestore. That fact is checked (a) here for UI gating and (b) — the
 * part that actually matters — inside firestore.rules for every admin
 * operation. Hiding frontend buttons is never the security boundary.
 *
 * Admin bootstrap: set `role: 'admin'` on your own `users/{uid}` document
 * once, via the Firebase Console (documented in README). No client path can
 * grant admin.
 */

export class AdminError extends Error {}

function requireFirebase(): void {
  if (!isFirebaseConfigured) {
    throw new AdminError('Admin tools require Firebase. This session is in Demo Mode.')
  }
}

interface TsLike {
  toDate?: () => Date
}

function iso(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as TsLike).toDate?.().toISOString() ?? null
  }
  return null
}

/* ------------------------------- Overview ------------------------------ */

export interface AdminOverview {
  users: number
  greetings: number
  pendingReports: number
  totalViews: number
  totalShares: number
}

export async function getAdminOverview(): Promise<AdminOverview> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getCountFromServer, getDocs, query, where, limit, orderBy } = await import(
      'firebase/firestore'
    )
    const [usersSnap, greetingsSnap, reportsSnap] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'greetings')),
      getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending'))),
    ])

    // totalViews/totalShares: computed from the most recent 500 greetings —
    // an honest, bounded read cost (no Cloud Functions on the free plan).
    let totalViews = 0
    let totalShares = 0
    const recent = await getDocs(
      query(collection(db, 'greetings'), orderBy('createdAt', 'desc'), limit(500)),
    )
    recent.forEach((d) => {
      totalViews += Number(d.data().views ?? 0)
      totalShares += Number(d.data().shares ?? 0)
    })

    return {
      users: usersSnap.data().count,
      greetings: greetingsSnap.data().count,
      pendingReports: reportsSnap.data().count,
      totalViews,
      totalShares,
    }
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

/* --------------------------------- Users -------------------------------- */

export async function listUsers(max = 200): Promise<UserProfile[]> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore')
    const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max)))
    const out: UserProfile[] = []
    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      out.push({
        uid: d.id,
        email: typeof data.email === 'string' ? data.email : null,
        displayName: typeof data.displayName === 'string' ? data.displayName : null,
        role: data.role === 'admin' ? 'admin' : 'user',
        createdAt: iso(data.createdAt) ?? '',
        greetingCount: Number(data.greetingCount ?? 0),
      })
    })
    return out
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

export async function adminSetUserRole(uid: string, role: UserRole): Promise<void> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'users', uid), { role })
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

/* ------------------------------- Greetings ------------------------------ */

export interface AdminGreetingRow extends Greeting {
  ownerEmail?: string | null
}

export async function listGreetingsAdmin(max = 200): Promise<AdminGreetingRow[]> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getDocs, query, orderBy, limit, doc, getDoc } = await import(
      'firebase/firestore'
    )
    const snap = await getDocs(
      query(collection(db, 'greetings'), orderBy('createdAt', 'desc'), limit(max)),
    )
    const rows: AdminGreetingRow[] = []
    const emailCache = new Map<string, string | null>()
    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>
      const ownerId = String(data.ownerId ?? '')
      if (ownerId && !emailCache.has(ownerId)) {
        try {
          const userSnap = await getDoc(doc(db, 'users', ownerId))
          emailCache.set(ownerId, userSnap.exists() ? String(userSnap.data().email ?? '') || null : null)
        } catch {
          emailCache.set(ownerId, null)
        }
      }
      rows.push({
        id: d.id,
        ownerId,
        ownerEmail: emailCache.get(ownerId) ?? null,
        occasion: data.occasion as Greeting['occasion'],
        templateId: String(data.templateId ?? ''),
        recipientName: String(data.recipientName ?? ''),
        senderName: String(data.senderName ?? ''),
        nickname: String(data.nickname ?? ''),
        relationship: String(data.relationship ?? ''),
        specialDate: String(data.specialDate ?? ''),
        message: String(data.message ?? ''),
        theme: data.theme as Greeting['theme'],
        animation: data.animation as Greeting['animation'],
        music: data.music as Greeting['music'],
        privacy: data.privacy as Greeting['privacy'],
        status: data.status === 'disabled' ? 'disabled' : 'active',
        views: Number(data.views ?? 0),
        shares: Number(data.shares ?? 0),
        scheduledAt: iso(data.scheduledAt),
        expiresAt: iso(data.expiresAt),
        passwordHash: typeof data.passwordHash === 'string' ? data.passwordHash : null,
        passwordSalt: typeof data.passwordSalt === 'string' ? data.passwordSalt : null,
        createdAt: iso(data.createdAt) ?? '',
        updatedAt: iso(data.updatedAt),
      })
    }
    return rows
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

export async function setGreetingStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
    await updateDoc(doc(db, 'greetings', id), { status, updatedAt: serverTimestamp() })
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

export async function adminDeleteGreeting(id: string): Promise<void> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'greetings', id))
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

/* -------------------------------- Reports ------------------------------- */

export async function listReports(status?: ReportStatus, max = 200): Promise<Report[]> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore')
    const q = status
      ? query(collection(db, 'reports'), where('status', '==', status), orderBy('createdAt', 'desc'), limit(max))
      : query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(max))
    const snap = await getDocs(q)
    const out: Report[] = []
    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      out.push({
        id: d.id,
        greetingId: String(data.greetingId ?? ''),
        reason: data.reason as Report['reason'],
        details: String(data.details ?? ''),
        reporterUid: typeof data.reporterUid === 'string' ? data.reporterUid : null,
        status: data.status as ReportStatus,
        createdAt: iso(data.createdAt) ?? '',
      })
    })
    return out
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

export async function setReportStatus(id: string, status: ReportStatus): Promise<void> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { doc, updateDoc } = await import('firebase/firestore')
    await updateDoc(doc(db, 'reports', id), { status })
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

/* ------------------------------- Templates ------------------------------ */

export async function setTemplateEnabled(templateId: string, enabled: boolean): Promise<void> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
    await setDoc(
      doc(db, 'templates', templateId),
      { enabled, updatedAt: serverTimestamp() },
      { merge: true },
    )
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

export async function getTemplateOverrideMap(): Promise<Record<string, { enabled?: boolean }>> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(collection(db, 'templates'))
    const out: Record<string, { enabled?: boolean }> = {}
    snap.forEach((d) => {
      out[d.id] = d.data() as { enabled?: boolean }
    })
    return out
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}

/* ------------------------------- Analytics ------------------------------ */

export interface AdminAnalytics {
  byOccasion: { id: string; count: number }[]
  byTheme: { id: string; count: number }[]
  byDay: { day: string; count: number }[]
  topByViews: { id: string; recipientName: string; views: number }[]
  sampledCount: number
}

export async function getAdminAnalytics(maxDocs = 500): Promise<AdminAnalytics> {
  requireFirebase()
  try {
    const { db } = await getFirebase()
    const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore')
    const snap = await getDocs(query(collection(db, 'greetings'), orderBy('createdAt', 'desc'), limit(maxDocs)))

    const occasions = new Map<string, number>()
    const themes = new Map<string, number>()
    const days = new Map<string, number>()
    const top: AdminAnalytics['topByViews'] = []

    snap.forEach((d) => {
      const data = d.data() as Record<string, unknown>
      const occ = String(data.occasion ?? 'custom')
      const th = String(data.theme ?? 'galaxy')
      occasions.set(occ, (occasions.get(occ) ?? 0) + 1)
      themes.set(th, (themes.get(th) ?? 0) + 1)
      const created = iso(data.createdAt)
      if (created) {
        const day = created.slice(0, 10)
        days.set(day, (days.get(day) ?? 0) + 1)
      }
      top.push({ id: d.id, recipientName: String(data.recipientName ?? ''), views: Number(data.views ?? 0) })
    })

    // Last 30 days, filled with zeros for missing days.
    const byDay: { day: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      byDay.push({ day: d, count: days.get(d) ?? 0 })
    }

    return {
      byOccasion: [...occasions.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      byTheme: [...themes.entries()].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      byDay,
      topByViews: top.sort((a, b) => b.views - a.views).slice(0, 8),
      sampledCount: snap.size,
    }
  } catch (err) {
    throw new AdminError(friendlyFirebaseError(err))
  }
}
