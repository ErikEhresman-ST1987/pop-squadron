// Pure rules for City Park's first boss. Timings and health are tuning values.
export const CITY_PARK_BOSS = Object.freeze({
  health: 110, radius: 43, enterAfterMs: 34000, reinforcementIntervalMs: 6500,
  reinforcementTypes: Object.freeze(['basic', 'durable', 'basic']),
  patrolMs: 6500, warningMs: 850, diveMs: 1150, retreatMs: 1350,
  patrolY: 105, diveBottomY: 555
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

export function bossAttackPosition(ageMs, aircraftX, state, config = CITY_PARK_BOSS) {
  const cycle = config.patrolMs + config.warningMs + config.diveMs + config.retreatMs;
  const t = ageMs % cycle;
  const patrolX = 180 + Math.sin(ageMs / 1000 * 1.35) * 112;
  if (t < config.patrolMs) return { x: patrolX, y: config.patrolY, phase: 'patrol', targetX: null };
  if (t < config.patrolMs + config.warningMs)
    return { x: state.startX, y: config.patrolY, phase: 'warning', targetX: state.targetX };
  const diveStart = config.patrolMs + config.warningMs;
  if (t < diveStart + config.diveMs) {
    const f = (t - diveStart) / config.diveMs;
    return { x: state.startX + (state.targetX - state.startX) * f,
      y: config.patrolY + (config.diveBottomY - config.patrolY) * f,
      phase: 'dive', targetX: state.targetX };
  }
  const f = (t - diveStart - config.diveMs) / config.retreatMs;
  return { x: state.targetX + (180 - state.targetX) * f,
    y: config.diveBottomY + (config.patrolY - config.diveBottomY) * f,
    phase: 'retreat', targetX: state.targetX };
}
