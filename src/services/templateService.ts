import type { OccasionId, TemplateConfig } from '@/types'
import { TEMPLATES, getTemplatesForOccasion, getTemplate } from '@/constants/templates'
import { isFirebaseConfigured } from '@/lib/env'
import { getFirebase } from '@/lib/firebase'

/**
 * templateService — templates are bundled configuration (single source of
 * truth in constants/templates.ts) with optional Firestore overrides in
 * `templates/{templateId}` that let admins disable a template without a
 * redeploy. Overrides are cached in memory; when Firebase is unavailable
 * (Demo Mode or offline), bundled templates simply work.
 */

export interface TemplateOverride {
  enabled?: boolean
}

let overrideCache: Record<string, TemplateOverride> | null = null
let overridePromise: Promise<Record<string, TemplateOverride>> | null = null

export function listTemplates(occasion: OccasionId | null = null): TemplateConfig[] {
  return getTemplatesForOccasion(occasion)
}

export function allTemplates(): TemplateConfig[] {
  return TEMPLATES
}

export function templateById(id: string | null | undefined): TemplateConfig | undefined {
  return getTemplate(id)
}

/** Fetch admin overrides (best-effort, cached). Never throws to callers. */
export async function fetchTemplateOverrides(): Promise<Record<string, TemplateOverride>> {
  if (!isFirebaseConfigured) return {}
  if (overrideCache) return overrideCache
  if (!overridePromise) {
    overridePromise = (async () => {
      try {
        const { db } = await getFirebase()
        const { collection, getDocs } = await import('firebase/firestore')
        const snap = await getDocs(collection(db, 'templates'))
        const out: Record<string, TemplateOverride> = {}
        snap.forEach((d) => {
          out[d.id] = d.data() as TemplateOverride
        })
        overrideCache = out
        return out
      } catch {
        overrideCache = {}
        return {}
      } finally {
        overridePromise = null
      }
    })()
  }
  return overridePromise
}

/** Templates visible to creators = bundled list minus admin-disabled ones. */
export async function listEnabledTemplates(occasion: OccasionId | null = null): Promise<TemplateConfig[]> {
  const base = listTemplates(occasion)
  const overrides = await fetchTemplateOverrides()
  return base.filter((t) => overrides[t.id]?.enabled !== false)
}

export function invalidateTemplateCache(): void {
  overrideCache = null
}
