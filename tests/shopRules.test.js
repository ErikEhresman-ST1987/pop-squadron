import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseWeapon, SHOP_WEAPONS } from '../src/game/shopRules.js';
import { readOwnership } from '../src/game/ownershipRules.js';
import { readWallet, saveWallet } from '../src/game/walletRules.js';

const storage = () => {
  const map = new Map();
  return { map, getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) };
};

test('approved weapon prices are fixed and starter is not sold', () => {
  assert.deepEqual(SHOP_WEAPONS.map(({id, price}) => [id, price]), [['sides', 500], ['tracking', 1000]]);
});

test('purchasing deducts once, permanently unlocks, and does not auto-equip', () => {
  const s = storage();
  saveWallet(s, 1030);
  assert.deepEqual(purchaseWeapon(s, 'sides'), {ok: true, balance: 530, owned: ['forward', 'sides']});
  assert.equal(readWallet(s), 530);
  assert.deepEqual(readOwnership(s), ['forward', 'sides']);
  assert.deepEqual(purchaseWeapon(s, 'sides'), {ok: false, reason: 'owned'});
  assert.equal(readWallet(s), 530);
  assert.deepEqual(purchaseWeapon(s, 'tracking'), {ok: false, reason: 'funds'});
  assert.equal(readWallet(s), 530);
});

test('insufficient funds and unknown weapon never deduct', () => {
  const s = storage();
  saveWallet(s, 499);
  assert.deepEqual(purchaseWeapon(s, 'sides'), {ok: false, reason: 'funds'});
  assert.deepEqual(purchaseWeapon(s, 'forward'), {ok: false, reason: 'unknown'});
  assert.equal(readWallet(s), 499);
});

test('wallet write failure blocks ownership grant', () => {
  const s = storage();
  saveWallet(s, 1000);
  const blocked = {...s, setItem: (key, value) => { if (key.includes('wallet')) throw Error('storage full'); s.setItem(key, value); }};
  assert.deepEqual(purchaseWeapon(blocked, 'tracking'), {ok: false, reason: 'storage'});
  assert.deepEqual(readOwnership(s), ['forward']);
  assert.equal(readWallet(s), 1000);
});

test('ownership write failure restores balance', () => {
  const s = storage();
  saveWallet(s, 1000);
  const blocked = {...s, setItem: (key, value) => { if (key.includes('ownership')) throw Error('storage full'); s.setItem(key, value); }};
  assert.deepEqual(purchaseWeapon(blocked, 'tracking'), {ok: false, reason: 'storage', balance: 1000});
  assert.equal(readWallet(s), 1000);
  assert.deepEqual(readOwnership(s), ['forward']);
});
