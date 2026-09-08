/* eslint-disable no-restricted-globals */
/**
 * NxK Greetings service worker — offline shell + asset cache.
 *
 * Hand-rolled (no Workbox, no build step): the app must stay a pure static
 * Vite bundle on Firebase Hosting's free tier. Strategy:
 *   • precache the app shell on install
 *   • navigations: network-first, fall back to the cached shell when offline
 *     (greetings still need the network for their data — the SW only keeps
 *     the UI reachable, it never fabricates content)
 *   • hashed /assets/* and fonts: cache-first (immutable)
 *   • everything else same-origin: stale-while-revalidate
 *   • never intercepts cross-origin traffic (Firebase Auth/Firestore use
 *     long-lived channels and must not be cached).
 */

const VERSION = 'nxxk-shell-v1'
const SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

/** Allow the page to ask for an immediate update after a deploy. */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

function isSameOrigin(request) {
  const url = new URL(request.url)
  return url.origin === self.location.origin
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then((hit) => {
    if (hit) return hit
    return fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone()
        caches.open(cacheName).then((cache) => cache.put(request, copy))
      }
      return response
    })
  })
}

function staleWhileRevalidate(request, cacheName) {
  return caches.match(request).then((hit) => {
    const network = fetch(request)
      .then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone()
          caches.open(cacheName).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => hit)
    return hit || network
  })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || !isSameOrigin(request)) return

  const url = new URL(request.url)

  // App navigations: network-first so deploys show up immediately, with the
  // cached shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(SHELL_CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() =>
          caches.match('/index.html').then((shell) => shell || Response.error()),
        ),
    )
    return
  }

  // Immutable hashed bundles + self-hosted fonts: cache-first forever.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.endsWith('.woff2')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }

  // Remaining static shell files: stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(request, SHELL_CACHE))
})
