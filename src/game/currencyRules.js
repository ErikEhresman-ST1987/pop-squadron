// Increment 6.1: approved rewards for a fully popped balloon.
// This module defines rewards only; gameplay payout and persistence come later.
export const BALLOON_REWARDS = Object.freeze({
  basic: 10,
  durable: 20,
  layered: 30
});

// Partial hits, escapes, collisions, and duplicate resolutions pay nothing.
// Only a final 'pop' event awards the balloon's full value.
export function rewardForBalloon(type, event) {
  if (event !== 'pop') return 0;
  if (!Object.hasOwn(BALLOON_REWARDS, type)) {
    throw new RangeError('Unknown balloon type: ' + type);
  }
  return BALLOON_REWARDS[type];
}

export function addReward(balance, reward) {
  if (!Number.isSafeInteger(balance) || balance < 0) {
    throw new RangeError('Balance must be a nonnegative safe integer');
  }
  if (!Number.isSafeInteger(reward) || reward < 0) {
    throw new RangeError('Reward must be a nonnegative safe integer');
  }
  const next = balance + reward;
  if (!Number.isSafeInteger(next)) throw new RangeError('Balance exceeds safe integer range');
  return next;
}
