import test from 'node:test';
import assert from 'node:assert/strict';
import { CITY_PARK_BOSS, bossPhase, bossHit, bossReward, bossAttackPosition, ZOO_BOSS, zooBossPhase, zooBossRadius, zooBossPosition, zooEscortInterval, zooAttackTiming, zooAttackPosition, THORNBACK_BOSS, thornbackPhase, thornbackPosition, thornbackShotPattern, thornbackEscortCount } from '../src/game/bossRules.js';
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


test('Zoo boss transitions through three phases and stays in upper/middle battlefield', () => {
  assert.equal(zooBossPhase(180), 'awakens');
  assert.equal(zooBossPhase(117), 'going-wild');
  assert.equal(zooBossPhase(54), 'last-gasp');
  assert.equal(zooBossPhase(0), 'defeated');
  assert.ok(zooBossRadius(54) < zooBossRadius(180));
  for (const health of [180, 100, 30]) for (let time = 0; time < 30000; time += 333) {
    const { x, y } = zooBossPosition(time, health);
    assert.ok(x >= 55 && x <= 305 && y >= 70 && y <= 225);
  }
  assert.ok(zooEscortInterval('last-gasp') < zooEscortInterval('awakens'));
  assert.ok(ZOO_BOSS.enterAfterMs > getMission(20).waves.at(-1).at);
});


test('Zoo charges telegraph, lock a target, strike it and return to upper battlefield', () => {
  for (const phase of ['awakens', 'going-wild', 'last-gasp']) {
    const timing = zooAttackTiming(phase);
    const state = { timing, bossAgeMs: 0, health: 180, startX: 140, startY: 130,
      targetX: 275, targetY: 490, returnX: 140, returnY: 130 };
    assert.equal(zooAttackPosition(timing.patrolMs + 1, state).action, 'warning');
    assert.deepEqual(zooAttackPosition(timing.patrolMs + timing.warningMs + timing.chargeMs, state),
      { x: 275, y: 490, action: 'retreat' });
    const end = zooAttackPosition(timing.patrolMs + timing.warningMs + timing.chargeMs + timing.retreatMs, state);
    assert.deepEqual(end, { x: 140, y: 130, action: 'retreat' });
  }
  assert.ok(zooAttackTiming('last-gasp').warningMs < zooAttackTiming('awakens').warningMs);
  assert.ok(zooAttackTiming('last-gasp').patrolMs < zooAttackTiming('awakens').patrolMs);
});

test('Thornback phases, movement and attack escalation stay bounded', () => {
  assert.equal(thornbackPhase(180), 'intact');
  assert.equal(thornbackPhase(126), 'damaged');
  assert.equal(thornbackPhase(63), 'critical');
  assert.equal(thornbackPhase(0), 'defeated');
  for (const health of [180, 100, 30]) for (let t = 0; t < 60000; t += 333) {
    const p = thornbackPosition(t, health);
    assert.ok(p.x >= 65 && p.x <= 295 && p.y >= 75 && p.y <= 180);
  }
  assert.ok(thornbackShotPattern('critical', 0).intervalMs < thornbackShotPattern('intact', 0).intervalMs);
  assert.equal(thornbackShotPattern('damaged', 1).count, 2);
  assert.equal(THORNBACK_BOSS.thornDamage, 10);
});
test('Thornback escorts start in phase two, taper off and never exceed cap', () => {
  assert.equal(thornbackEscortCount('intact', 0), 0);
  assert.equal(thornbackEscortCount('damaged', 0), 3);
  assert.equal(thornbackEscortCount('critical', 9), 3);
  assert.equal(thornbackEscortCount('critical', 12), 0);
  assert.equal(thornbackEscortCount('damaged', 15), 0);
  assert.equal(THORNBACK_BOSS.escortCap, 15);
});
