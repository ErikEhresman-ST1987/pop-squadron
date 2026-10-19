import test from 'node:test';
import assert from 'node:assert/strict';
import { BALLOON_TYPES } from '../src/definitions/balloons.js';
import { createBalloonState, balloonAppearance, hitBalloon, removeBalloon } from '../src/game/balloonRules.js';
import { MissionRules } from '../src/game/missionRules.js';

test('three data-defined balloon types have the approved hit counts', () => {
  assert.deepEqual(Object.keys(BALLOON_TYPES), ['basic', 'durable', 'layered']);
  assert.equal(BALLOON_TYPES.basic.hits, 1);
  assert.equal(BALLOON_TYPES.durable.hits, 3);
  assert.equal(BALLOON_TYPES.layered.hits, 3);
});
test('basic balloon pops in one hit and cannot pop twice', () => {
  const initial = createBalloonState(1, 'basic');
  const result = hitBalloon(initial);
  assert.equal(result.event, 'pop');
  assert.equal(result.state.resolved, true);
  assert.equal(hitBalloon(result.state).event, 'ignored');
  assert.equal(initial.resolved, false);
});
test('durable balloon needs three hits and retains size and speed', () => {
  let state = createBalloonState(2, 'durable');
  const original = balloonAppearance(state);
  for (let i = 0; i < 2; i++) {
    const result = hitBalloon(state);
    assert.equal(result.event, 'damaged');
    state = result.state;
    assert.deepEqual(balloonAppearance(state), original);
  }
  assert.equal(hitBalloon(state).event, 'pop');
});
test('layered balloon changes appearance and speed while keeping identity', () => {
  let state = createBalloonState(3, 'layered');
  const stages = [balloonAppearance(state)];
  for (let i = 0; i < 2; i++) {
    const result = hitBalloon(state);
    assert.equal(result.event, 'layer-removed');
    state = result.state;
    assert.equal(state.id, 3);
    assert.equal(state.resolved, false);
    stages.push(balloonAppearance(state));
  }
  assert.deepEqual(stages.map(stage => stage.radius), [21, 16, 11]);
  assert.deepEqual(stages.map(stage => stage.speedMultiplier), [1, 1.15, 1.30]);
  assert.equal(hitBalloon(state).event, 'pop');
});
test('partial hits do not affect mission pop and escape accounting', () => {
  const mission = new MissionRules();
  let state = createBalloonState(4, 'layered');
  state = hitBalloon(state).state;
  state = hitBalloon(state).state;
  assert.equal(mission.popped, 0);
  assert.equal(mission.escapes, 0);
  const final = hitBalloon(state);
  assert.equal(final.event, 'pop');
  assert.equal(mission.resolve(final.state.id, final.event), true);
  assert.equal(mission.resolve(final.state.id, final.event), false);
  assert.equal(mission.popped, 1);
});
test('partially damaged layered balloon escapes once', () => {
  const mission = new MissionRules();
  const damaged = hitBalloon(createBalloonState(5, 'layered')).state;
  const escaped = removeBalloon(damaged, 'escape');
  assert.equal(escaped.event, 'escape');
  assert.equal(removeBalloon(escaped.state, 'escape').event, 'ignored');
  assert.equal(hitBalloon(escaped.state).event, 'ignored');
  assert.equal(mission.resolve(escaped.state.id, escaped.event), true);
  assert.equal(mission.resolve(escaped.state.id, escaped.event), false);
  assert.equal(mission.escapes, 1);
});
test('collision removes remaining layers without awarding a pop or escape', () => {
  const mission = new MissionRules();
  const result = removeBalloon(createBalloonState(6, 'layered'), 'collision');
  assert.equal(result.event, 'collision');
  mission.resolve(result.state.id, result.event);
  assert.equal(mission.health, 80);
  assert.equal(mission.popped, 0);
  assert.equal(mission.escapes, 0);
});
test('invalid type, identity, or removal reason is rejected', () => {
  assert.throws(() => createBalloonState(-1, 'basic'));
  assert.throws(() => createBalloonState(1, 'unknown'));
  assert.throws(() => removeBalloon(createBalloonState(1, 'basic'), 'pop'));
});
test('new balloon state starts at full health, supporting replay reset', () => {
  const initial = createBalloonState(7, 'layered');
  const damaged = hitBalloon(initial).state;
  assert.equal(damaged.remainingHits, 2);
  const replay = createBalloonState(7, 'layered');
  assert.equal(replay.remainingHits, 3);
  assert.equal(replay.resolved, false);
});
