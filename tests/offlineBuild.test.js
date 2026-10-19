import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('offline navigation serves the HTML from the same versioned cache as JS and CSS', async () => {
  const script = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  assert.match(script, /await cache\.addAll\(ASSETS\)/);
  assert.match(script, /const page = await cache\.match\(SCOPE \+ 'index\.html'\)/);
  assert.match(script, /if \(page\) return page/);
  assert.match(script, /return await cache\.match\(request\) \|\| fetch\(request\)/);
  assert.doesNotMatch(script, /if \(response\.ok\) return response/);
});

test('offline precache includes HTML and compiled assets and replaces obsolete versions', async () => {
  const script = await readFile(new URL('../scripts/prepare-offline.mjs', import.meta.url), 'utf8');
  assert.match(script, /p\.endsWith\('index\.html'\)/);
  assert.match(script, /p\.includes\('assets'\)/);
  assert.match(script, /hash\.update\(await readFile\(path\)\)/);
  assert.match(script, /name !== CACHE/);
});
