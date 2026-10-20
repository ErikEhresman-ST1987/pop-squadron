// Expandable catalog. IDs and slot keys preserve existing local saves.
export const WEAPON_CATEGORIES = Object.freeze([
  Object.freeze({ id: 'primary', label: 'Primary' }),
  Object.freeze({ id: 'secondary-1', label: 'Wing Guns' }),
  Object.freeze({ id: 'secondary-2', label: 'Missiles' })
]);
export const WEAPON_GROUPS = Object.freeze([
  Object.freeze({ id: 'general', label: 'General Weapons' }),
  Object.freeze({ id: 'specialized', label: 'Specialized Weapons' })
]);
export const WEAPON_REGISTRY = Object.freeze([
  Object.freeze({ id: 'forward', name: 'Forward Cannon', slot: 'primary', group: 'general',
    price: 0, unlockSector: 1, intervalMs: 240, projectiles: 1, targeting: 'straight',
    description: 'Reliable forward fire.' }),
  Object.freeze({ id: 'sides', name: 'Twin Side Guns', slot: 'secondary-1', group: 'general',
    price: 500, unlockSector: 1, intervalMs: 650, projectiles: 2, targeting: 'straight',
    description: 'Twin wing-mounted guns.' }),
  Object.freeze({ id: 'tracking', name: 'Tracking Launcher', slot: 'secondary-2', group: 'general',
    price: 1000, unlockSector: 1, intervalMs: 1500, projectiles: 1, targeting: 'nearest',
    range: 220, description: 'Guided missiles track nearby balloons.' })
]);
export const getWeapon = id => WEAPON_REGISTRY.find(weapon => weapon.id === id) ?? null;
export const weaponsIn = (slot, group) =>
  WEAPON_REGISTRY.filter(weapon => weapon.slot === slot && weapon.group === group);
