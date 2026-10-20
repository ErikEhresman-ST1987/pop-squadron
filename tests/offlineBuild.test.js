import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('offline navigation serves the HTML from the same versioned cache as JS and CSS', async () => {
  const script = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  assert.match(script, /await cache\.addAll\(ASSETS\)/);
  assert.match(script, /const page = await cache\.match\(SCOPE \+ 'index\.html'\)/);
  assert.match(script, /if \(page\) return page/);
  assert.match(script, /const cached = await cache\.match\(request\)/);
  assert.match(script, /if \(cached\) return cached/);
  assert.match(script, /const oldAsset = await oldCache\.match\(request\)/);
  assert.match(script, /if \(oldAsset\) return oldAsset/);
  assert.doesNotMatch(script, /if \(response\.ok\) return response/);
});

test('offline precache includes HTML and compiled assets and preserves older versions for existing clients', async () => {
  const script = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  assert.match(script, /p\.endsWith\('index\.html'\)/);
  assert.match(script, /p\.includes\('assets'\)/);
  assert.match(script, /hash\.update\(await readFile\(path\)\)/);
  assert.match(script, /name === CACHE/);
  assert.doesNotMatch(script, /caches\.delete\(name\)/);
});

test('installed app reloads on a new controlling worker', async () => {
  const source = await readFile(new URL('../src/offline.js', import.meta.url), 'utf8');
  assert.match(source, /controllerchange/);
  assert.match(source, /window\.location\.replace/);
  assert.match(source, /sessionStorage\.setItem/);
});
test('worker activation does not navigate active gameplay', async () => {
  const source = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  assert.ok(source.includes('self.clients.claim()'));
  assert.ok(!source.includes('client.navigate('));
});

test('release probe bypasses service worker cache and reports worker build identity', async () => {
  const script = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  const source = await readFile(new URL('../src/offline.js', import.meta.url), 'utf8');
  assert.ok(script.includes("url.pathname === SCOPE + 'release.json'"));
  assert.ok(script.includes('BUILD_VERSION'));
  assert.ok(source.includes("updateViaCache: 'none'"));
  assert.ok(source.includes("cache: 'no-store'"));
  assert.ok(source.includes('readWorkerBuild'));
  assert.ok(source.includes('visibilitychange'));
  assert.ok(source.includes('check-updates'));
});

test('manual update retry is not blocked by a previous automatic refresh attempt', async () => {
  const source = await readFile(new URL('../src/offline.js', import.meta.url), 'utf8');
  assert.match(source, /if \(!manual && sessionStorage\.getItem\(refreshKey\) === version\)/);
  assert.match(source, /checkForUpdates\(true\)/);
  assert.match(source, /refreshFor\(latest, manual\)/);
  assert.ok(source.includes('if (activeBuild === latest) void refreshFor(latest, manual);'));
  assert.doesNotMatch(source, /\buserRequested\b/);
  assert.match(source, /searchParams\.set\('release'/);
  assert.match(source, /window\.location\.replace\(url\.href\)/);
  assert.match(source, /sessionStorage\.removeItem\(refreshKey\)/);
});

test('pending refresh waits for the hangar', async () => {
  const offline = await readFile(new URL('../src/offline.js', import.meta.url), 'utf8');
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.ok(offline.includes('pendingRefresh = { version, manual }'));
  assert.ok(offline.includes('if (missionActive())'));
  assert.ok(offline.includes('applyPendingRefresh'));
  assert.ok(main.includes('pop-squadron-hangar'));
});

test('update waits for the new worker to control the page before reloading', async () => {
  const source = await readFile(new URL('../src/offline.js', import.meta.url), 'utf8');
  assert.match(source, /const controllingBuild = controller \? await readWorkerBuild\(controller\) : null/);
  assert.match(source, /if \(controllingBuild !== version\)/);
  assert.match(source, /pendingRefresh = \{ version, manual \}/);
  assert.match(source, /controllerchange/);
  assert.match(source, /void refreshFor\(version, manual\)/);
  assert.ok(source.indexOf('if (controllingBuild !== version)') < source.indexOf('window.location.replace(url.href)'));
});
