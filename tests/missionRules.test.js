import test from 'node:test';
import assert from 'node:assert/strict';
import { MissionRules, MISSION } from '../src/game/missionRules.js';

test('a balloon can resolve only once', () => {
  const rules = new MissionRules();
  assert.equal(rules.resolve(1,'pop'),true);
  assert.equal(rules.resolve(1,'escape'),false);
  assert.equal(rules.popped,1);
  assert.equal(rules.escapes,0);
});
test('collisions damage health without counting escapes', () => {
  const rules = new MissionRules();
  rules.resolve(2,'collision');
  assert.equal(rules.health,80);
  assert.equal(rules.escapes,0);
});
test('escape allowance permits five and fails on sixth', () => {
  const rules = new MissionRules();
  for(let i=0;i<MISSION.escapeAllowance;i++) rules.resolve(i,'escape');
  assert.equal(rules.outcome,null);
  rules.resolve(99,'escape');
  assert.equal(rules.outcome,'defeat');
});
test('zero health is defeat', () => {
  const rules = new MissionRules();
  for(let i=0;i<5;i++) rules.resolve(i,'collision');
  assert.equal(rules.outcome,'defeat');
});
test('victory requires all waves spawned and no active balloons', () => {
  const rules = new MissionRules();
  assert.equal(rules.checkVictory(false,0),null);
  assert.equal(rules.checkVictory(true,1),null);
  assert.equal(rules.checkVictory(true,0),'victory');
  assert.equal(rules.resolve(3,'escape'),false);
});

test('boss contact uses ordinary aircraft damage without resolving balloon identities', () => {
  const rules = new MissionRules();
  for (let i = 0; i < 4; i++) assert.equal(rules.damageAircraft(), true);
  assert.equal(rules.health, 20);
  assert.equal(rules.escapes, 0);
  assert.equal(rules.popped, 0);
  assert.equal(rules.resolved.size, 0);
  assert.equal(rules.damageAircraft(), true);
  assert.equal(rules.health, 0);
  assert.equal(rules.outcome, 'defeat');
  assert.equal(rules.damageAircraft(), false);
  assert.equal(rules.resolve(123, 'pop'), false);
});

test('sixth escape immediately freezes resolution and prevents extra payouts', () => {
  const rules = new MissionRules();
  for (let i = 0; i < 6; i++) assert.equal(rules.resolve(i, 'escape'), true);
  assert.equal(rules.outcome, 'defeat');
  assert.equal(rules.resolve(6, 'pop'), false);
  assert.equal(rules.popped, 0);
  assert.equal(rules.escapes, 6);
});
