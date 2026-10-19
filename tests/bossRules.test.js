import test from 'node:test';
import assert from 'node:assert/strict';
import { CITY_PARK_BOSS, bossPhase, bossHit, bossReward } from '../src/game/bossRules.js';
import { getMission } from '../src/game/missionDefinitions.js';
import { completeMission } from '../src/game/progressionRules.js';

test('boss transitions at half health and never goes negative', () => {
  assert.equal(bossPhase(110), 'movement');
  assert.equal(bossPhase(56), 'movement');
  assert.equal(bossPhase(55), 'reinforcements');
  assert.equal(bossPhase(0), 'defeated');
  assert.equal(bossHit(1), 0);
  assert.equal(bossHit(0), 0);
});
test('boss mission has three opening waves and five escapes', () => {
  const m = getMission(10);
  assert.equal(m.waves.length, 3);
  assert.equal(m.escapeAllowance, 5);
  assert.ok(CITY_PARK_BOSS.enterAfterMs > m.waves.at(-1).at);
});
test('first boss victory pays more than replay and does not invent Mission 11', () => {
  assert.ok(bossReward(true) > bossReward(false));
  assert.deepEqual(completeMission({ highestUnlocked: 10 }, 10, 'victory'), { highestUnlocked: 10 });
});
