// Renderer-independent weapon definitions, cooldowns, and targeting.
export const WEAPONS = Object.freeze({
  forward: Object.freeze({ id: 'forward', slot: 'primary', intervalMs: 240, projectiles: 1, targeting: 'straight' }),
  sides: Object.freeze({ id: 'sides', slot: 'secondary-1', intervalMs: 650, projectiles: 2, targeting: 'straight' }),
  tracking: Object.freeze({ id: 'tracking', slot: 'secondary-2', intervalMs: 1500, projectiles: 1, targeting: 'nearest', range: 220 })
});
export const WEAPON_ORDER = Object.freeze(['forward', 'sides', 'tracking']);

export function initialWeaponState() {
  return Object.freeze(Object.fromEntries(WEAPON_ORDER.map(id => [id, 0])));
}

// Coordinates are battlefield pixels. Resolved/inactive targets are ineligible.
// Equal-distance ties preserve encounter order.
export function nearestTarget(origin, targets, maxRange = WEAPONS.tracking.range) {
  if (!origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y) || !Number.isFinite(maxRange) || maxRange < 0) return null;
  let best = null;
  let bestDistanceSquared = maxRange * maxRange;
  for (const target of targets) {
    if (!target || target.resolved || target.active === false || !Number.isFinite(target.x) || !Number.isFinite(target.y) || target.id == null) continue;
    const distanceSquared = (target.x - origin.x) ** 2 + (target.y - origin.y) ** 2;
    if (distanceSquared <= bestDistanceSquared && (best === null || distanceSquared < bestDistanceSquared)) {
      best = target;
      bestDistanceSquared = distanceSquared;
    }
  }
  return best;
}

// Each weapon advances independently. A tracking opportunity with no target
// is skipped, not banked for a later burst.
export function advanceWeapons(state, deltaMs, origin, targets = [], equippedWeaponIds = WEAPON_ORDER) {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError('deltaMs must be finite and nonnegative');
  const next = {};
  const volleys = [];
  const enabled = new Set(equippedWeaponIds);
  for (const id of WEAPON_ORDER) {
    const weapon = WEAPONS[id];
    if (!enabled.has(id)) { next[id] = 0; continue; }
    const elapsed = state[id] + deltaMs;
    if (!Number.isFinite(state[id]) || state[id] < 0 || state[id] >= weapon.intervalMs || !Number.isFinite(elapsed)) throw new RangeError('Invalid weapon timer');
    const opportunities = Math.floor(elapsed / weapon.intervalMs);
    next[id] = elapsed % weapon.intervalMs;
    for (let i = 0; i < opportunities; i++) {
      const target = weapon.targeting === 'nearest' ? nearestTarget(origin, targets, weapon.range) : null;
      if (weapon.targeting === 'nearest' && target === null) continue;
      volleys.push(Object.freeze({ weaponId: id, projectiles: weapon.projectiles, targetId: target?.id ?? null }));
    }
  }
  return Object.freeze({ state: Object.freeze(next), volleys: Object.freeze(volleys) });
}
