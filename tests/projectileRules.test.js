import test from 'node:test';
import assert from 'node:assert/strict';
import { getWeapon } from '../src/game/weaponRegistry.js';
import { projectileSpecs, moveProjectile } from '../src/game/projectileRules.js';
import { createBalloonState, hitBalloon } from '../src/game/balloonRules.js';

test('existing weapons retain exact projectile launch geometry and speeds', () => {
  const origin = { x: 180, y: 400 };
  const forward = projectileSpecs(getWeapon('forward'), origin);
  assert.deepEqual(forward.map(s => [s.x, s.y, s.speed, s.damage]), [[180,375,440,1]]);
  const wings = projectileSpecs(getWeapon('sides'), origin);
  assert.deepEqual(wings.map(s => [s.x,s.y,s.speed,s.damage]), [[156,375,440,1],[204,375,440,1]]);
  const guided = projectileSpecs(getWeapon('tracking'), origin, 7);
  assert.deepEqual(guided.map(s => [s.x,s.y,s.speed,s.damage,s.targetId]), [[180,382,320,1,7]]);
  assert.deepEqual(moveProjectile({x:180,y:375},forward[0],.1),{x:180,y:331});
});
test('damage is configurable without changing the default hit', () => {
  const balloon = createBalloonState(1,'durable');
  assert.equal(hitBalloon(balloon).state.remainingHits, balloon.remainingHits - 1);
  assert.equal(hitBalloon(balloon, balloon.remainingHits).event, 'pop');
  assert.throws(() => hitBalloon(balloon, 0), RangeError);
});

test('new primary weapons use distinct tested projectile recipes', () => {
  const origin = { x: 180, y: 400 };
  const rapid = projectileSpecs(getWeapon('rapid'), origin);
  assert.equal(rapid.length, 1);
  assert.equal(rapid[0].speed, 480);
  const heavy = projectileSpecs(getWeapon('heavy'), origin);
  assert.equal(heavy[0].damage, 3);
  assert.equal(hitBalloon(createBalloonState(3, 'durable'), heavy[0].damage).event, 'pop');
  const piercing = projectileSpecs(getWeapon('piercing'), origin);
  assert.equal(piercing[0].piercing, true);
  const burst = projectileSpecs(getWeapon('burst'), origin);
  assert.deepEqual(burst.map(s => s.x), [171, 180, 189]);
  assert.equal(burst.every(s => s.damage === 1), true);
});
