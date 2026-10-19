import test from 'node:test';
import assert from 'node:assert/strict';
import { LOADOUT_KEY, SLOTS, defaultLoadout, normalizeLoadout, readLoadout, saveLoadout } from '../src/game/loadoutRules.js';
import { OWNERSHIP_KEY, readOwnership, saveOwnership, normalizeOwnership } from '../src/game/ownershipRules.js';
import { WALLET_KEY, readWallet } from '../src/game/walletRules.js';

const starter = { primary: 'forward', 'secondary-1': null, 'secondary-2': null };
const previous = { primary: 'forward', 'secondary-1': 'sides', 'secondary-2': 'tracking' };
const storageFor = (entries = []) => {
  const values = new Map(entries);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('new players start with the forward cannon only', () => {
  assert.deepEqual(SLOTS.map(slot => slot.id), ['primary', 'secondary-1', 'secondary-2']);
  assert.deepEqual(defaultLoadout(), starter);
  assert.deepEqual(readOwnership(storageFor()), ['forward']);
});

test('existing equipped secondary weapons become locked without losing save data', () => {
  const storage = storageFor([[LOADOUT_KEY, JSON.stringify(previous)], [WALLET_KEY, '380']]);
  const before = storage.values.get(LOADOUT_KEY);
  assert.deepEqual(readLoadout(storage, readOwnership(storage)), starter);
  assert.equal(readWallet(storage), 380);
  assert.equal(storage.values.get(LOADOUT_KEY), before);
});

test('ownership permits restored equipment and persists independently', () => {
  const storage = storageFor();
  assert.equal(saveOwnership(storage, ['sides', 'tracking']), true);
  const owned = readOwnership(storage);
  assert.deepEqual(owned, ['forward', 'sides', 'tracking']);
  assert.deepEqual(normalizeLoadout(previous, owned), previous);
  assert.equal(saveLoadout(storage, previous, owned), true);
  assert.deepEqual(readLoadout(storage, owned), previous);
  assert.ok(storage.values.has(OWNERSHIP_KEY));
});

test('primary can be empty but incompatible and unowned equipment are rejected', () => {
  assert.deepEqual(normalizeLoadout({ primary: null, 'secondary-1': 'tracking', 'secondary-2': 'sides' }), {
    primary: null, 'secondary-1': null, 'secondary-2': null
  });
  assert.deepEqual(normalizeOwnership(['unknown', 'forward', 'forward']), ['forward']);
});

test('invalid or blocked storage fails safely', () => {
  assert.deepEqual(readLoadout({ getItem: () => '{invalid' }), starter);
  assert.deepEqual(readOwnership({ getItem: () => '{invalid' }), ['forward']);
  assert.equal(saveLoadout({ setItem: () => { throw new Error('blocked'); } }, starter), false);
  assert.equal(saveOwnership({ setItem: () => { throw new Error('blocked'); } }, ['forward']), false);
});
