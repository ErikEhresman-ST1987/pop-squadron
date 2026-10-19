import test from 'node:test';
import assert from 'node:assert/strict';
import { WALLET_KEY, readWallet, saveWallet, creditWallet } from '../src/game/walletRules.js';

function storage() {
  const values = new Map();
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, value)
  };
}

test('new wallet starts at zero and survives reloading from storage', () => {
  const local = storage();
  assert.equal(readWallet(local), 0);
  assert.equal(saveWallet(local, 380), true);
  assert.equal(readWallet(local), 380);
  assert.equal(local.getItem(WALLET_KEY), '380');
});

test('each pop immediately credits wallet and mission replay credits again', () => {
  const local = storage();
  let balance = readWallet(local);
  balance = creditWallet(local, balance, 10).balance;
  balance = creditWallet(local, balance, 30).balance;
  assert.equal(readWallet(local), 40);
  balance = readWallet(local); // New mission after defeat or replay.
  balance = creditWallet(local, balance, 10).balance;
  assert.equal(balance, 50);
  assert.equal(readWallet(local), 50);
});

test('malformed or negative saved values are safely ignored', () => {
  const local = storage();
  for (const bad of ['oops', '-10', '1.2', 'null', '{}', '9007199254740992']) {
    local.setItem(WALLET_KEY, bad);
    assert.equal(readWallet(local), 0);
  }
});

test('storage errors do not prevent earning within the current session', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(readWallet(broken), 0);
  assert.equal(saveWallet(broken, 20), false);
  assert.deepEqual(creditWallet(broken, 0, 20), { balance: 20, saved: false });
});

test('invalid balances cannot be stored', () => {
  const local = storage();
  assert.equal(saveWallet(local, -1), false);
  assert.equal(saveWallet(local, 2.5), false);
});
