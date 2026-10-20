import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';

const root = 'dist';
const release = process.env.GITHUB_SHA || process.env.POP_BUILD_ID || 'local-development';
await writeFile(join(root, 'release.json'), JSON.stringify({ build: release }) + '\n');
const prefix = '/pop-squadron/';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...await walk(path));
    else if (entry.isFile() && entry.name !== 'sw.js') results.push(path);
  }
  return results;
}
const paths = (await walk(root)).sort();
if (!paths.some(p => p.endsWith('index.html')) || !paths.some(p => p.endsWith('manifest.webmanifest')) || !paths.some(p => p.includes('assets'))) {
  throw new Error('Offline build is missing HTML, manifest, or compiled assets.');
}
const urls = paths.map(p => prefix + relative(root, p).split(sep).join('/'));
const hash = createHash('sha256');
for (const path of paths) {
  hash.update(relative(root, path));
  hash.update(await readFile(path));
}
const cache = 'pop-squadron-static-' + hash.digest('hex').slice(0, 16);
const source = `const CACHE = ${JSON.stringify(cache)};
const BUILD = ${JSON.stringify(release)};
const ASSETS = ${JSON.stringify(urls)};
const SCOPE = '/pop-squadron/';
// Keep the active cache immutable for the lifetime of its worker. New workers
// activate with their own cache; old clients may still request old asset URLs.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    // Do not delete old bundles during activation: existing tabs can still
    // be running an older build and need its hashed JavaScript/CSS assets.
    // A later maintenance release can prune caches after clients have closed.
    await self.clients.claim();
    // Refresh visible legacy installed clients that lack controllerchange support.
    // No saved-game data or old asset caches are deleted.
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: false });
    for (const client of clients) {
      if (client.visibilityState !== 'visible' || !client.url.startsWith(self.location.origin + SCOPE)) continue;
      try { await client.navigate(client.url); } catch { /* Client may have closed. */ }
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'BUILD_VERSION') event.ports[0]?.postMessage({ build: BUILD });
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  // The release probe must reach the network; never serve a stale precached version.
  if (url.pathname === SCOPE + 'release.json') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      // The page must come from the SAME precached build as its JS and CSS.
      // A network-first HTML response could reference a newer bundle than
      // the active service worker has cached, breaking offline startup.
      const page = await cache.match(SCOPE + 'index.html');
      if (page) return page;
      return fetch(request);
    }
    // A navigation can arrive from a previous worker while new assets are
    // deploying. Never cache-mix a new HTML document with an old JS bundle.
    // Hashed assets are resolved from their own build's cache if needed.
    const cached = await cache.match(request);
    if (cached) return cached;
    const names = await caches.keys();
    for (const name of names) {
      if (!name.startsWith('pop-squadron-static-') || name === CACHE) continue;
      const oldCache = await caches.open(name);
      const oldAsset = await oldCache.match(request);
      if (oldAsset) return oldAsset;
    }
    return fetch(request);
  })());
});`;
await writeFile(join(root, 'sw.js'), source + '\n');
console.log('Offline bundle ready:', urls.length, 'assets; cache', cache);
