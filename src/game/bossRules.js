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


// Zoo boss: remains in the upper/middle battlefield; three health-driven phases.
export const ZOO_BOSS = Object.freeze({
  health: 180, radius: 49, enterAfterMs: 32000, patrolCenterX: 180,
  reinforcementTypes: Object.freeze(['basic', 'layered', 'durable']),
  phaseThresholds: Object.freeze([0.65, 0.30])
});
export function zooBossPhase(health, maxHealth = ZOO_BOSS.health) {
  if (health <= 0) return 'defeated';
  if (health <= maxHealth * ZOO_BOSS.phaseThresholds[1]) return 'last-gasp';
  if (health <= maxHealth * ZOO_BOSS.phaseThresholds[0]) return 'going-wild';
  return 'awakens';
}
export function zooBossRadius(health, maxHealth = ZOO_BOSS.health) {
  const phase = zooBossPhase(health, maxHealth);
  return phase === 'last-gasp' ? 32 : phase === 'going-wild' ? 42 : ZOO_BOSS.radius;
}
export function zooBossPosition(ageMs, health, maxHealth = ZOO_BOSS.health) {
  const t = ageMs / 1000;
  const phase = zooBossPhase(health, maxHealth);
  const x = phase === 'last-gasp'
    ? 180 + Math.sin(t * 3.4) * 90 + Math.sin(t * 5.3) * 30
    : phase === 'going-wild'
      ? 180 + Math.sin(t * 2.3) * 105 + Math.sin(t * 0.9) * 20
      : 180 + Math.sin(t * 1.1) * 105;
  const y = phase === 'last-gasp'
    ? 155 + Math.sin(t * 2.7) * 55
    : phase === 'going-wild' ? 140 + Math.sin(t * 1.7) * 62
      : 115 + Math.sin(t * 0.85) * 28;
  return { x: Math.max(55, Math.min(305, x)), y: Math.max(70, Math.min(225, y)), phase };
}
export function zooEscortInterval(phase) {
  return phase === 'last-gasp' ? 7800 : phase === 'going-wild' ? 9500 : 12000;
}


// Attack cycle timing is selected at the beginning of each charge, so taking
// damage mid-charge cannot unexpectedly cancel the telegraphed maneuver.
export function zooAttackTiming(phase) {
  if (phase === 'last-gasp') return { patrolMs: 2300, warningMs: 650, chargeMs: 680, retreatMs: 850 };
  if (phase === 'going-wild') return { patrolMs: 3400, warningMs: 850, chargeMs: 850, retreatMs: 1100 };
  return { patrolMs: 4700, warningMs: 1150, chargeMs: 1050, retreatMs: 1300 };
}
export function zooAttackPosition(elapsedMs, state) {
  const { patrolMs, warningMs, chargeMs, retreatMs } = state.timing;
  if (elapsedMs < patrolMs) return { ...zooBossPosition(state.bossAgeMs + elapsedMs, state.health), action: 'patrol' };
  if (elapsedMs < patrolMs + warningMs)
    return { x: state.startX, y: state.startY, action: 'warning' };
  const chargeStart = patrolMs + warningMs;
  if (elapsedMs < chargeStart + chargeMs) {
    const f = (elapsedMs - chargeStart) / chargeMs;
    return { x: state.startX + (state.targetX - state.startX) * f,
      y: state.startY + (state.targetY - state.startY) * f, action: 'charge' };
  }
  const f = Math.min(1, (elapsedMs - chargeStart - chargeMs) / retreatMs);
  return { x: state.targetX + (state.returnX - state.targetX) * f,
    y: state.targetY + (state.returnY - state.targetY) * f, action: 'retreat' };
}


// Forest Outbreak finale: readable thorn volleys and capped escorts.
export const THORNBACK_BOSS = Object.freeze({
  health: 180, radius: 52, enterAfterMs: 32000,
  phaseThresholds: Object.freeze([0.70, 0.35]),
  reinforcementTypes: Object.freeze(['basic', 'durable']),
  escortCap: 15, escortGroupSize: 3,
  escortIntervalMs: 11000,
  thornDamage: 10
});
export function thornbackPhase(health, maxHealth = THORNBACK_BOSS.health) {
  if (health <= 0) return 'defeated';
  if (health <= maxHealth * THORNBACK_BOSS.phaseThresholds[1]) return 'critical';
  if (health <= maxHealth * THORNBACK_BOSS.phaseThresholds[0]) return 'damaged';
  return 'intact';
}
export function thornbackPosition(ageMs, health) {
  const t = ageMs / 1000;
  const phase = thornbackPhase(health);
  const x = phase === 'critical'
    ? 180 + Math.sin(t * 2.05) * 90 + Math.sin(t * 0.83) * 18
    : phase === 'damaged'
      ? 180 + Math.sin(t * 1.52) * 100 + Math.sin(t * 0.65) * 14
      : 180 + Math.sin(t * 0.92) * 93;
  const y = phase === 'critical'
    ? 125 + Math.sin(t * 1.35) * 42
    : phase === 'damaged' ? 113 + Math.sin(t * 0.9) * 24 : 107 + Math.sin(t * 0.55) * 12;
  return { x: Math.max(65, Math.min(295, x)), y: Math.max(75, Math.min(180, y)), phase };
}
export function thornbackShotPattern(phase, volleyIndex) {
  if (phase === 'critical') return { count: volleyIndex % 2 ? 2 : 3, speed: 162, intervalMs: 2500, spread: 0.27 };
  if (phase === 'damaged') return { count: volleyIndex % 2 ? 2 : 3, speed: 143, intervalMs: 3000, spread: 0.26 };
  return { count: 3, speed: 126, intervalMs: 3500, spread: 0.28 };
}
export function thornbackEscortCount(phase, spawned) {
  if (phase === 'intact' || phase === 'defeated' || spawned >= THORNBACK_BOSS.escortCap) return 0;
  if (phase === 'critical' && spawned >= 12) return 0;
  return Math.min(THORNBACK_BOSS.escortGroupSize, THORNBACK_BOSS.escortCap - spawned);
}
