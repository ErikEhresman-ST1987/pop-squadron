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
  assert.deepEqual(normalizeProgress({ highestUnlocked: 99 }), defaultProgress());
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
