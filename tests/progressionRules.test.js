import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESS_KEY, defaultProgress, normalizeProgress, readProgress, saveProgress, isMissionUnlocked, completeMission } from '../src/game/progressionRules.js';

test('new players can access only Mission 1', () => {
  const p = defaultProgress();
  assert.deepEqual(p, { highestUnlocked: 1 });
  assert.equal(isMissionUnlocked(p, 1), true);
  assert.equal(isMissionUnlocked(p, 2), false);
  assert.equal(isMissionUnlocked(p, 3), false);
});
test('winning sequential missions unlocks exactly the next mission', () => {
  const p1 = completeMission(defaultProgress(), 1, 'victory');
  assert.deepEqual(p1, { highestUnlocked: 2 });
  const p2 = completeMission(p1, 2, 'victory');
  assert.deepEqual(p2, { highestUnlocked: 3 });
  const p3 = completeMission(p2, 3, 'victory');
  assert.deepEqual(p3, { highestUnlocked: 4 });
  const p4 = completeMission(p3, 4, 'victory');
  const p5 = completeMission(p4, 5, 'victory');
  assert.deepEqual(p5, { highestUnlocked: 6 });
  const p6 = completeMission(p5, 6, 'victory');
  assert.deepEqual(p6, { highestUnlocked: 7 });
  const p7 = completeMission(p6, 7, 'victory');
  const p8 = completeMission(p7, 8, 'victory');
  assert.deepEqual(p8, { highestUnlocked: 9 });
  assert.deepEqual(completeMission(p8, 9, 'victory'), { highestUnlocked: 10 });
});
test('defeat, locked missions, and replay never advance or revoke unlocks', () => {
  const p = { highestUnlocked: 2 };
  assert.deepEqual(completeMission(p, 2, 'defeat'), p);
  assert.deepEqual(completeMission(p, 3, 'victory'), p);
  assert.deepEqual(completeMission(p, 1, 'victory'), p);
  assert.equal(isMissionUnlocked(p, 1), true);
});
test('progress survives a save and reload', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.equal(saveProgress(storage, { highestUnlocked: 2 }), true);
  assert.deepEqual(JSON.parse(data.get(PROGRESS_KEY)), { highestUnlocked: 2 });
  assert.deepEqual(readProgress(storage), { highestUnlocked: 2 });
});
test('corrupt and unsupported storage fails safely', () => {
  const invalid = { getItem: () => '{bad json', setItem: () => { throw Error('blocked'); } };
  assert.deepEqual(readProgress(invalid), defaultProgress());
  assert.equal(saveProgress(invalid, defaultProgress()), false);
  assert.deepEqual(normalizeProgress({ highestUnlocked: 99 }), { highestUnlocked: 99 });
  assert.deepEqual(normalizeProgress({ highestUnlocked: 2.5 }), defaultProgress());
  assert.deepEqual(normalizeProgress({ highestUnlocked: '3' }), defaultProgress());
});

test('previously saved Mission 3 unlock persists and advances to Mission 4', () => {
  const data = new Map([[PROGRESS_KEY, JSON.stringify({ highestUnlocked: 3 })]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const previous = readProgress(storage);
  assert.equal(isMissionUnlocked(previous, 3), true);
  assert.equal(isMissionUnlocked(previous, 4), false);
  const next = completeMission(previous, 3, 'victory');
  assert.equal(next.highestUnlocked, 4);
  assert.equal(saveProgress(storage, next), true);
  assert.equal(readProgress(storage).highestUnlocked, 4);
});

test('defeating City Park boss unlocks Zoo Mission 11 and preserves saved progression', () => {
  const progress = { highestUnlocked: 10 };
  const zoo = completeMission(progress, 10, 'victory');
  assert.deepEqual(zoo, { highestUnlocked: 11 });
  assert.equal(isMissionUnlocked(zoo, 11), true);
  assert.equal(isMissionUnlocked(zoo, 12), false);
  const storage = new Map();
  const api = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) };
  assert.equal(saveProgress(api, zoo), true);
  assert.deepEqual(readProgress(api), zoo);
  assert.deepEqual(completeMission(zoo, 11, 'victory'), { highestUnlocked: 12 });
});

test('Zoo missions 11–13 unlock sequentially and replay cannot skip ahead', () => {
  const eleven = { highestUnlocked: 11 };
  const twelve = completeMission(eleven, 11, 'victory');
  assert.deepEqual(twelve, { highestUnlocked: 12 });
  assert.equal(isMissionUnlocked(twelve, 13), false);
  assert.deepEqual(completeMission(twelve, 11, 'victory'), twelve);
  assert.deepEqual(completeMission(twelve, 12, 'defeat'), twelve);
  const thirteen = completeMission(twelve, 12, 'victory');
  assert.deepEqual(thirteen, { highestUnlocked: 13 });
  assert.equal(isMissionUnlocked(thirteen, 13), true);
  assert.equal(isMissionUnlocked(thirteen, 14), false);
  const fourteen = completeMission(thirteen, 13, 'victory');
  assert.deepEqual(fourteen, { highestUnlocked: 14 });
  assert.equal(isMissionUnlocked(fourteen, 14), true);
  assert.equal(isMissionUnlocked(fourteen, 15), false);
  assert.deepEqual(completeMission(fourteen, 11, 'victory'), fourteen);
  const storage = new Map();
  const api = { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) };
  assert.equal(saveProgress(api, thirteen), true);
  assert.deepEqual(readProgress(api), thirteen);
});

test('temporary removal of authored missions never erases saved unlocks', () => {
  const data = new Map([[PROGRESS_KEY, JSON.stringify({ highestUnlocked: 20 })]]);
  const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.deepEqual(readProgress(storage), { highestUnlocked: 20 });
  assert.equal(saveProgress(storage, readProgress(storage)), true);
  assert.deepEqual(JSON.parse(data.get(PROGRESS_KEY)), { highestUnlocked: 20 });
  assert.deepEqual(completeMission(readProgress(storage), 1, 'victory'), { highestUnlocked: 20 });
});


test('Zoo missions 14–16 unlock sequentially without skipping or exceeding authored missions', () => {
  const fourteen = { highestUnlocked: 14 };
  assert.deepEqual(completeMission(fourteen, 15, 'victory'), fourteen);
  const fifteen = completeMission(fourteen, 14, 'victory');
  assert.deepEqual(fifteen, { highestUnlocked: 15 });
  const sixteen = completeMission(fifteen, 15, 'victory');
  assert.deepEqual(sixteen, { highestUnlocked: 16 });
  assert.deepEqual(completeMission(sixteen, 16, 'victory'), { highestUnlocked: 17 });
  assert.deepEqual(completeMission(sixteen, 14, 'victory'), sixteen);
});


test('Zoo missions 17–19 unlock sequentially and stop before the unbuilt boss', () => {
  const seventeen = { highestUnlocked: 17 };
  assert.deepEqual(completeMission(seventeen, 18, 'victory'), seventeen);
  const eighteen = completeMission(seventeen, 17, 'victory');
  assert.deepEqual(eighteen, { highestUnlocked: 18 });
  const nineteen = completeMission(eighteen, 18, 'victory');
  assert.deepEqual(nineteen, { highestUnlocked: 19 });
  assert.deepEqual(completeMission(nineteen, 19, 'victory'), nineteen);
  assert.equal(isMissionUnlocked(nineteen, 20), false);
  assert.deepEqual(completeMission(nineteen, 17, 'victory'), nineteen);
});
