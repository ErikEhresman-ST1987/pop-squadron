import test from 'node:test';
import assert from 'node:assert/strict';
import { LOADOUT_KEY, SLOTS, defaultLoadout, normalizeLoadout, readLoadout, saveLoadout } from '../src/game/loadoutRules.js';

test('fixed slots match weapon categories and begin fully equipped', () => {
  assert.deepEqual(SLOTS.map(slot => slot.id), ['primary', 'secondary-1', 'secondary-2']);
  assert.deepEqual(defaultLoadout(), { primary: 'forward', 'secondary-1': 'sides', 'secondary-2': 'tracking' });
});
test('unequipped weapons persist and incompatible equipment is rejected', () => {
  assert.deepEqual(normalizeLoadout({ primary: null, 'secondary-1': 'tracking', 'secondary-2': null }), {
    primary: null, 'secondary-1': 'sides', 'secondary-2': null
  });
});
test('saved selections restore after reopening', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const selected = { primary: 'forward', 'secondary-1': null, 'secondary-2': 'tracking' };
  assert.equal(saveLoadout(storage, selected), true);
  assert.equal(values.has(LOADOUT_KEY), true);
  assert.deepEqual(readLoadout(storage), selected);
});
test('invalid or unavailable storage falls back safely', () => {
  assert.deepEqual(readLoadout({ getItem: () => '{invalid' }), defaultLoadout());
  assert.deepEqual(readLoadout({ getItem: () => { throw new Error('blocked'); } }), defaultLoadout());
  assert.equal(saveLoadout({ setItem: () => { throw new Error('blocked'); } }, defaultLoadout()), false);
});
