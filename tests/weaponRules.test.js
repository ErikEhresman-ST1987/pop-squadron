import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, initialWeaponState, nearestTarget, advanceWeapons } from '../src/game/weaponRules.js';

const origin = { x: 100, y: 100 };
const targets = [{ id: 7, x: 110, y: 100, resolved: false }, { id: 8, x: 180, y: 100, resolved: false }];

test('approved weapon configuration and fixed slots', () => {
  assert.deepEqual(['forward', 'sides', 'tracking'].map(id => WEAPONS[id]).map(w => [w.slot, w.intervalMs, w.projectiles]), [
    ['primary', 240, 1], ['secondary-1', 650, 2], ['secondary-2', 1500, 1]
  ]);
  assert.equal(WEAPONS.tracking.range, 220);
});
test('forward cannon fires every 240ms', () => {
  let result = advanceWeapons(initialWeaponState(), 239, origin);
  assert.equal(result.volleys.length, 0);
  result = advanceWeapons(result.state, 1, origin);
  assert.deepEqual(result.volleys.map(v => v.weaponId), ['forward']);
  result = advanceWeapons(result.state, 480, origin);
  assert.deepEqual(result.volleys.filter(v => v.weaponId === 'forward').map(v => v.weaponId), ['forward', 'forward']);
});
test('twin guns emit two projectiles every 650ms', () => {
  const result = advanceWeapons(initialWeaponState(), 650, origin);
  const sides = result.volleys.filter(v => v.weaponId === 'sides');
  assert.equal(sides.length, 1);
  assert.equal(sides[0].projectiles, 2);
  assert.equal(sides[0].targetId, null);
});
test('tracking launcher fires at 1500ms when a target exists', () => {
  const before = advanceWeapons(initialWeaponState(), 1499, origin, targets);
  assert.equal(before.volleys.some(v => v.weaponId === 'tracking'), false);
  const after = advanceWeapons(before.state, 1, origin, targets);
  assert.deepEqual(after.volleys.filter(v => v.weaponId === 'tracking').map(v => v.targetId), [7]);
});
test('tracking launcher skips empty opportunity and does not burst later', () => {
  const skipped = advanceWeapons(initialWeaponState(), 1500, origin, []);
  assert.equal(skipped.volleys.some(v => v.weaponId === 'tracking'), false);
  const next = advanceWeapons(skipped.state, 1499, origin, targets);
  assert.equal(next.volleys.some(v => v.weaponId === 'tracking'), false);
  assert.equal(advanceWeapons(next.state, 1, origin, targets).volleys.filter(v => v.weaponId === 'tracking').length, 1);
});
test('nearest eligible target within inclusive range; resolved and inactive ignored', () => {
  assert.equal(nearestTarget(origin, targets)?.id, 7);
  assert.equal(nearestTarget(origin, [{ id: 1, x: 320, y: 100 }])?.id, 1);
  assert.equal(nearestTarget(origin, [{ id: 1, x: 321, y: 100 }]), null);
  assert.equal(nearestTarget(origin, [{ id: 1, x: 100, y: 100, resolved: true }, { id: 2, x: 101, y: 100, active: false }]), null);
  assert.equal(nearestTarget(origin, [{ id: 9, x: 110, y: 100 }, { id: 10, x: 110, y: 100 }])?.id, 9);
});
test('weapons keep independent cooldowns and can fire together', () => {
  const result = advanceWeapons(initialWeaponState(), 7800, origin, targets);
  assert.equal(result.volleys.filter(v => v.weaponId === 'forward').length, 32);
  assert.equal(result.volleys.filter(v => v.weaponId === 'sides').length, 12);
  assert.equal(result.volleys.filter(v => v.weaponId === 'tracking').length, 5);
  assert.equal(result.state.forward, 120);
  assert.equal(result.state.sides, 0);
  assert.equal(result.state.tracking, 300);
});
test('new mission resets all weapon timers', () => {
  const state = advanceWeapons(initialWeaponState(), 400, origin).state;
  assert.notDeepEqual(state, initialWeaponState());
  assert.equal(Object.values(initialWeaponState()).every(v => v === 0), true);
});
test('invalid timing and invalid targeting inputs fail safely', () => {
  assert.throws(() => advanceWeapons(initialWeaponState(), -1, origin), RangeError);
  assert.throws(() => advanceWeapons(initialWeaponState(), Infinity, origin), RangeError);
  assert.equal(nearestTarget({ x: NaN, y: 0 }, targets), null);
  assert.equal(nearestTarget(origin, [{ id: 3, x: NaN, y: 1 }]), null);
});

test('unequipped weapons never fire and their cooldowns remain reset', () => {
  const result = advanceWeapons(initialWeaponState(), 3000, origin, targets, ['forward', 'tracking']);
  assert.equal(result.volleys.some(v => v.weaponId === 'sides'), false);
  assert.equal(result.volleys.filter(v => v.weaponId === 'forward').length, 12);
  assert.equal(result.volleys.filter(v => v.weaponId === 'tracking').length, 2);
  assert.equal(result.state.sides, 0);
});
test('fully unequipped loadout fires nothing', () => {
  const result = advanceWeapons(initialWeaponState(), 3000, origin, targets, []);
  assert.deepEqual(result.volleys, []);
  assert.deepEqual(result.state, initialWeaponState());
});
test('reenabling a weapon restores its ordinary firing schedule', () => {
  const disabled = advanceWeapons(initialWeaponState(), 1300, origin, targets, ['forward']);
  const enabled = advanceWeapons(disabled.state, 650, origin, targets, ['forward', 'sides']);
  assert.equal(enabled.volleys.filter(v => v.weaponId === 'sides').length, 1);
});
