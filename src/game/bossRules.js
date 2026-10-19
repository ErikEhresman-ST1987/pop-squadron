// Pure rules for City Park's first boss. Timings and health are tuning values.
export const CITY_PARK_BOSS = Object.freeze({
  health: 110, radius: 43, enterAfterMs: 34000, reinforcementIntervalMs: 6500,
  reinforcementTypes: Object.freeze(['basic', 'durable', 'basic'])
});
export function bossPhase(health, maxHealth = CITY_PARK_BOSS.health) {
  if (health <= 0) return 'defeated';
  return health <= maxHealth / 2 ? 'reinforcements' : 'movement';
}
export function bossHit(health, damage = 1) {
  return Math.max(0, health - damage);
}
export function bossReward(firstVictory) {
  return firstVictory ? 1500 : 500;
}
