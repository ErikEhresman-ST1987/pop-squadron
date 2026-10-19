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
