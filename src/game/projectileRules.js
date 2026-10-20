// Renderer-independent projectile recipes. New weapons can reuse these patterns.
const PATTERNS = Object.freeze({
  center: Object.freeze([0]),
  wings: Object.freeze([-24, 24]),
  burst: Object.freeze([-9, 0, 9])
});

export function projectileSpecs(weapon, origin, targetId = null) {
  if (!weapon || !origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y))
    throw new TypeError('Valid weapon and origin required');
  const kind = weapon.targeting === 'nearest' ? 'tracking' : 'straight';
  const offsets = PATTERNS[weapon.projectilePattern];
  if (!offsets || offsets.length !== weapon.projectiles)
    throw new RangeError('Unsupported projectile pattern/count');
  return offsets.map(offset => Object.freeze({
    kind, x: origin.x + offset, y: origin.y + (kind === 'tracking' ? -18 : -25),
    targetId: kind === 'tracking' ? targetId : null,
    speed: weapon.projectileSpeed, damage: weapon.damage, piercing: weapon.piercing === true,
    vx: 0, vy: -1, color: weapon.projectileColor,
    width: weapon.projectileWidth, height: weapon.projectileHeight,
    radius: weapon.projectileRadius
  }));
}

export function moveProjectile(position, projectile, deltaSeconds) {
  return { x: position.x + projectile.vx * projectile.speed * deltaSeconds,
    y: position.y + projectile.vy * projectile.speed * deltaSeconds };
}
