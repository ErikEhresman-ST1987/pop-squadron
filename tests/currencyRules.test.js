import test from 'node:test';
import assert from 'node:assert/strict';
import { BALLOON_REWARDS, rewardForBalloon, addReward } from '../src/game/currencyRules.js';
import { createBalloonState, hitBalloon, removeBalloon } from '../src/game/balloonRules.js';

test('approved balloon reward amounts are exact and fixed', () => {
  assert.deepEqual(BALLOON_REWARDS, { basic: 10, durable: 20, layered: 30 });
  assert.equal(Object.isFrozen(BALLOON_REWARDS), true);
});

test('only the final pop pays, not partial hits or duplicate hits', () => {
  for (const [type, amount] of Object.entries(BALLOON_REWARDS)) {
    let balloon = createBalloonState(1, type);
    let earned = 0;
    while (!balloon.resolved) {
      const result = hitBalloon(balloon);
      earned = addReward(earned, rewardForBalloon(type, result.event));
      balloon = result.state;
    }
    assert.equal(earned, amount);
    assert.equal(rewardForBalloon(type, hitBalloon(balloon).event), 0);
  }
});

test('escape, collision, and damage do not pay rewards', () => {
  for (const type of Object.keys(BALLOON_REWARDS)) {
    for (const reason of ['escape', 'collision']) {
      const result = removeBalloon(createBalloonState(2, type), reason);
      assert.equal(rewardForBalloon(type, result.event), 0);
    }
  }
  assert.equal(rewardForBalloon('layered', 'layer-removed'), 0);
  assert.equal(rewardForBalloon('durable', 'damaged'), 0);
});

test('replays earn full rewards independently of earlier attempts', () => {
  let balance = 0;
  for (let play = 0; play < 3; play++) {
    balance = addReward(balance, rewardForBalloon('basic', 'pop'));
  }
  assert.equal(balance, 30);
});

test('earnings accumulate without requiring mission victory', () => {
  const balance = addReward(20, rewardForBalloon('layered', 'pop'));
  assert.equal(balance, 50);
});

test('invalid rewards and unsafe balances are rejected', () => {
  assert.throws(() => rewardForBalloon('unknown', 'pop'), RangeError);
  assert.throws(() => addReward(-1, 10), RangeError);
  assert.throws(() => addReward(0, -10), RangeError);
  assert.throws(() => addReward(1.5, 10), RangeError);
  assert.throws(() => addReward(Number.MAX_SAFE_INTEGER, 10), RangeError);
});
