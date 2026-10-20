import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_REGISTRY, WEAPON_CATEGORIES, WEAPON_GROUPS, getWeapon, weaponsIn } from '../src/game/weaponRegistry.js';
import { normalizeLoadout } from '../src/game/loadoutRules.js';
import { normalizeOwnership } from '../src/game/ownershipRules.js';

test('three categories and two groupings remain data-driven', () => {
  assert.deepEqual(WEAPON_CATEGORIES.map(c => c.label), ['Primary', 'Wing Guns', 'Missiles']);
  assert.deepEqual(WEAPON_GROUPS.map(g => g.id), ['general', 'specialized']);
  assert.equal(WEAPON_REGISTRY.length, 3);
  assert.deepEqual(weaponsIn('secondary-1', 'general').map(w => w.id), ['sides']);
  assert.deepEqual(weaponsIn('secondary-1', 'specialized'), []);
});
test('existing weapons retain identity, prices, cooldowns and save compatibility', () => {
  assert.equal(getWeapon('forward').intervalMs, 240);
  assert.equal(getWeapon('sides').price, 500);
  assert.equal(getWeapon('tracking').price, 1000);
  assert.deepEqual(normalizeOwnership(['sides', 'tracking']), ['forward', 'sides', 'tracking']);
  const saved = { primary: 'forward', 'secondary-1': 'sides', 'secondary-2': 'tracking' };
  assert.deepEqual(normalizeLoadout(saved, ['forward', 'sides', 'tracking']), saved);
});
