import { useEffect } from 'react'
import { getAppUrl } from '@/lib/env'

export interface SeoOptions {
  title: string
  description?: string
  /** Path like '/dashboard' — canonical becomes APP_URL + path */
  canonicalPath?: string
  ogType?: 'website' | 'article'
  ogImage?: string
  /** Greeting pages: noindex (private/unlisted content shouldn't be crawled) */
  noindex?: boolean
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = href
}

function setRobots(content: string): void {
  setMeta('name', 'robots', content)
}

/**
 * useSeo — dependency-free per-route SEO: title, meta description,
 * Open Graph, Twitter/X cards, canonical URL and robots.
 */
export function useSeo({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage,
  noindex = false,
}: SeoOptions): void {
  useEffect(() => {
    document.title = title
    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
      setMeta('name', 'twitter:description', description)
    }
    setMeta('property', 'og:title', title)
    setMeta('name', 'twitter:title', title)
    setMeta('property', 'og:type', ogType)
    if (ogImage) {
      setMeta('property', 'og:image', ogImage)
      setMeta('name', 'twitter:image', ogImage)
    }
    const base = getAppUrl()
    const url = canonicalPath ? `${base}${canonicalPath}` : window.location.href
    setMeta('property', 'og:url', url)
    setCanonical(url)
    setRobots(noindex ? 'noindex, nofollow' : 'index, follow')
  }, [title, description, canonicalPath, ogType, ogImage, noindex])
}
