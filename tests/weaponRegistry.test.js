import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPON_REGISTRY, WEAPON_CATEGORIES, WEAPON_GROUPS, getWeapon, weaponsIn } from '../src/game/weaponRegistry.js';
import { normalizeLoadout } from '../src/game/loadoutRules.js';
import { normalizeOwnership } from '../src/game/ownershipRules.js';

test('three categories and two groupings remain data-driven', () => {
  assert.deepEqual(WEAPON_CATEGORIES.map(c => c.label), ['Primary', 'Wing Darts', 'Seeking Darts']);
  assert.deepEqual(WEAPON_GROUPS.map(g => g.id), ['general', 'specialized']);
  assert.equal(WEAPON_REGISTRY.length, 15);
  assert.deepEqual(weaponsIn('primary', 'general').map(w => w.id), ['forward', 'rapid', 'heavy', 'burst']);
  assert.deepEqual(weaponsIn('primary', 'specialized').map(w => w.id), ['piercing']);
  assert.deepEqual(weaponsIn('secondary-1', 'general').map(w => w.id), ['sides', 'wide']);
  assert.deepEqual(weaponsIn('secondary-1', 'specialized').map(w => w.id), ['rear', 'turrets', 'flak']);
  assert.deepEqual(weaponsIn('secondary-2', 'general').map(w => w.id), ['swarm', 'heavy-missile', 'tracking']);
  assert.deepEqual(weaponsIn('secondary-2', 'specialized').map(w => w.id), ['cluster', 'interceptor']);
});
test('existing weapons retain identity, prices, cooldowns and save compatibility', () => {
  assert.equal(getWeapon('forward').intervalMs, 240);
  assert.equal(getWeapon('sides').price, 500);
  assert.equal(getWeapon('tracking').price, 1000);
  assert.deepEqual(normalizeOwnership(['sides', 'tracking']), ['forward', 'sides', 'tracking']);
  const saved = { primary: 'forward', 'secondary-1': 'sides', 'secondary-2': 'tracking' };
  assert.deepEqual(normalizeLoadout(saved, ['forward', 'sides', 'tracking']), saved);
});

test('dart rebrand preserves weapon IDs and removes legacy weapon labels', () => {
  const expected = ['Standard Darts', 'Rapid Darts', 'Heavy-Tip Darts', 'Piercing Darts', 'Triple Darts', 'Twin Wing Darts', 'Fan Darts', 'Rear-Firing Darts', 'Auto-Aiming Darts', 'Burst Darts', 'Swarm-Seeking Darts', 'Heavy-Seeking Dart', 'Cluster Darts', 'Rapid-Seeking Darts', 'Bloon-Seeking Darts'];
  assert.deepEqual(WEAPON_REGISTRY.map(weapon => weapon.name), expected);
  for (const weapon of WEAPON_REGISTRY) {
    assert.doesNotMatch(weapon.name + ' ' + weapon.description, /missile|cannon|gun|turret|round/i);
  }
});
