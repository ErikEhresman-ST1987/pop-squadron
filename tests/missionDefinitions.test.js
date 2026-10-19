import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, getMission } from '../src/game/missionDefinitions.js';
import { MISSION, MissionRules } from '../src/game/missionRules.js';
import { BALLOON_TYPES } from '../src/definitions/balloons.js';

test('three ordered authored missions with stable lookup', () => {
  assert.deepEqual(MISSIONS.map(m => [m.id, m.difficulty]), [
    [1, 'Easy'], [2, 'Moderate'], [3, 'Challenging']
  ]);
  assert.equal(getMission(1), MISSION);
  assert.equal(getMission(3), MISSIONS[2]);
  assert.equal(getMission(999), null);
});

test('Mission 1 preserves the original four-wave configuration exactly', () => {
  assert.deepEqual(MISSION.waves.map(w => [w.at, w.pattern, w.count, w.speed, [...w.types]]), [
    [1200, 'formation', 5, 70, ['basic']],
    [16000, 'drift', 6, 82, ['basic', 'durable', 'basic']],
    [33000, 'formation', 7, 88, ['basic', 'layered', 'basic']],
    [52000, 'drift', 8, 96, ['durable', 'basic', 'layered', 'basic']]
  ]);
  assert.deepEqual([MISSION.health, MISSION.collisionDamage, MISSION.escapeAllowance], [100, 20, 5]);
});

test('every mission has valid increasing wave timings and supported definitions', () => {
  for (const m of MISSIONS) {
    assert.ok(m.waves.length >= 4);
    assert.equal(m.health, 100);
    assert.equal(m.escapeAllowance, 5);
    let lastAt = -1;
    for (const w of m.waves) {
      assert.ok(w.at > lastAt);
      lastAt = w.at;
      assert.ok(['formation', 'drift'].includes(w.pattern));
      assert.ok(Number.isInteger(w.count) && w.count > 0);
      assert.ok(w.speed > 0);
      assert.ok(w.types.length > 0);
      for (const type of w.types) assert.ok(BALLOON_TYPES[type]);
    }
    assert.equal(new MissionRules(m).config, m);
    assert.ok(Object.isFrozen(m) && Object.isFrozen(m.waves));
  }
});

test('later missions add pressure without changing weapon or balloon mechanics', () => {
  const counts = MISSIONS.map(m => m.waves.reduce((sum, w) => sum + w.count, 0));
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
  assert.ok(MISSIONS[1].waves.some(w => w.types.includes('layered') && w.types.includes('durable')));
  assert.ok(MISSIONS[2].waves.length > MISSIONS[1].waves.length);
});
