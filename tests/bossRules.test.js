import test from 'node:test';
import assert from 'node:assert/strict';
import { CITY_PARK_BOSS, bossPhase, bossHit, bossReward, bossAttackPosition } from '../src/game/bossRules.js';
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
test('first boss victory pays more than replay and unlocks authored Zoo Mission 11', () => {
  assert.ok(bossReward(true) > bossReward(false));
  assert.deepEqual(completeMission({ highestUnlocked: 10 }, 10, 'victory'), { highestUnlocked: 11 });
  assert.equal(getMission(11)?.name, 'Mission 11: Zoo Entrance');
});

test('boss dive locks its target and returns to patrol height', () => {
  const config = CITY_PARK_BOSS;
  const attack = { startX: 150, targetX: 270 };
  const warning = bossAttackPosition(config.patrolMs + 100, 20, attack);
  assert.equal(warning.phase, 'warning');
  assert.equal(warning.targetX, 270);
  const dive = bossAttackPosition(config.patrolMs + config.warningMs + config.diveMs / 2, 20, attack);
  assert.equal(dive.phase, 'dive');
  assert.equal(dive.x, 210);
  assert.ok(dive.y > config.patrolY);
  const retreat = bossAttackPosition(config.patrolMs + config.warningMs + config.diveMs + config.retreatMs / 2, 20, attack);
  assert.equal(retreat.phase, 'retreat');
  assert.ok(retreat.y < config.diveBottomY);
});
