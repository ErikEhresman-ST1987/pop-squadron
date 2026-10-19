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
  assert.deepEqual(completeMission(p2, 3, 'victory'), p2);
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
