/* AI Atlas service worker.
 *
 * Strategy:
 *   - Navigation requests: stale-while-revalidate. We return the cached shell
 *     immediately when available and refresh in the background. If both fail
 *     (offline + uncached), we serve /offline.
 *   - Static assets (CSS/JS/images/fonts): cache-first with background refresh.
 *   - All other requests (e.g. JSON data, pagefind): network-first with cache
 *     fallback so the freshest data wins when online.
 *
 * Caches:
 *   - app-shell-v1: precached on install for offline startup.
 *   - runtime-v1:   populated as the user navigates.
 */

const APP_SHELL_CACHE = 'app-shell-v1';
const RUNTIME_CACHE = 'runtime-v1';

// This file is served as-is by GitHub Pages (not processed by Astro/Vite), so
// it can't read the build's `base` config directly. `self.registration.scope`
// is set to the SW's own scope URL at registration time (see RegisterSW.tsx),
// which already carries the deploy subpath — deriving BASE from it here keeps
// this file correct even if the site moves to a different subpath later.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, '');

// CSS/JS asset filenames are content-hashed by the build and unknown ahead of
// time, so only precache routes here; static assets are picked up by
// `cacheFirst` the first time each page requests them.
const APP_SHELL_URLS = [`${BASE}/`, `${BASE}/offline`, `${BASE}/favicon.svg`];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // Cache each URL individually so a single failure does not abort install.
      await Promise.all(
        APP_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (_err) {
            // Ignore — network may be unavailable at install time.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([APP_SHELL_CACHE, RUNTIME_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.map((name) => (keep.has(name) ? null : caches.delete(name))));
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return /\.(?:css|js|mjs|svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|otf)(\?.*)?$/i.test(
    url.pathname,
  );
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => undefined);
    return cached;
  }
  const network = await networkPromise;
  if (network) return network;
  return null;
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone()).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (_err) {
    return null;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (_err) {
    const cached = await cache.match(request);
    return cached || null;
  }
}

async function offlineFallback() {
  const cache = await caches.open(APP_SHELL_CACHE);
  const offline = await cache.match(`${BASE}/offline`);
  if (offline) return offline;
  return new Response(
    '<!doctype html><html><head><meta charset="utf-8"><title>Offline</title></head>' +
      '<body><h1>Offline</h1><p>You are offline and this page is not cached.</p>' +
      `<p><a href="${BASE}/">Go home</a></p></body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: stale-while-revalidate with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const response = await staleWhileRevalidate(request);
        if (response) return response;
        return offlineFallback();
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const response = await cacheFirst(request);
        if (response) return response;
        // Last resort: try the network directly so we do not return a blank.
        return fetch(request).catch(() => new Response('', { status: 504 }));
      })(),
    );
    return;
  }

  // JSON / data / other same-origin GETs.
  event.respondWith(
    (async () => {
      const response = await networkFirst(request);
      if (response) return response;
      return new Response('', { status: 504 });
    })(),
  );
});
