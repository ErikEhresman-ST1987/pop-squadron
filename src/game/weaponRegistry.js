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
    price: 0, unlockSector: 1, intervalMs: 240, projectiles: 1, targeting: 'straight', damage: 1, projectileSpeed: 440, projectilePattern: 'center', projectileColor: 0xb3f7ff, projectileWidth: 4, projectileHeight: 15,
    description: 'Reliable forward fire.' }),
  Object.freeze({ id: 'rapid', name: 'Rapid-Fire Cannon', slot: 'primary', group: 'general',
    price: 750, unlockSector: 1, intervalMs: 130, projectiles: 1, targeting: 'straight', damage: 1, projectileSpeed: 480, projectilePattern: 'center', projectileColor: 0x8af6d0, projectileWidth: 3, projectileHeight: 12,
    description: 'Fast, steady stream of light shots.' }),
  Object.freeze({ id: 'heavy', name: 'Heavy Cannon', slot: 'primary', group: 'general',
    price: 1200, unlockSector: 2, intervalMs: 900, projectiles: 1, targeting: 'straight', damage: 3, projectileSpeed: 350, projectilePattern: 'center', projectileColor: 0xffab6d, projectileWidth: 9, projectileHeight: 19,
    description: 'Slow, powerful rounds deal three damage.' }),
  Object.freeze({ id: 'piercing', name: 'Piercing Cannon', slot: 'primary', group: 'specialized',
    price: 2000, unlockSector: 3, intervalMs: 500, projectiles: 1, targeting: 'straight', damage: 1, projectileSpeed: 500, projectilePattern: 'center', piercing: true, projectileColor: 0xd6b4ff, projectileWidth: 5, projectileHeight: 22,
    description: 'Shots pass through multiple aligned balloons.' }),
  Object.freeze({ id: 'burst', name: 'Burst Cannon', slot: 'primary', group: 'general',
    price: 2500, unlockSector: 4, intervalMs: 850, projectiles: 3, targeting: 'straight', damage: 1, projectileSpeed: 440, projectilePattern: 'burst', projectileColor: 0xffe68a, projectileWidth: 5, projectileHeight: 14,
    description: 'Three closely grouped rounds per burst.' }),
  Object.freeze({ id: 'sides', name: 'Twin Side Guns', slot: 'secondary-1', group: 'general',
    price: 500, unlockSector: 1, intervalMs: 650, projectiles: 2, targeting: 'straight', damage: 1, projectileSpeed: 440, projectilePattern: 'wings', projectileColor: 0xffc979, projectileWidth: 4, projectileHeight: 12,
    description: 'Twin wing-mounted guns.' }),
  Object.freeze({ id: 'wide', name: 'Wide-Angle Guns', slot: 'secondary-1', group: 'general',
    price: 900, unlockSector: 1, intervalMs: 700, projectiles: 3, targeting: 'straight', damage: 1, projectileSpeed: 420, projectilePattern: 'wide', projectileColor: 0xffd992, projectileWidth: 4, projectileHeight: 12,
    description: 'Three shots fan outward to cover a wider lane.' }),
  Object.freeze({ id: 'rear', name: 'Rear-Defense Guns', slot: 'secondary-1', group: 'specialized',
    price: 1300, unlockSector: 2, intervalMs: 550, projectiles: 2, targeting: 'straight', damage: 1, projectileSpeed: 420, projectilePattern: 'rear', projectileColor: 0xffa5a5, projectileWidth: 4, projectileHeight: 12,
    description: 'Twin guns fire backward at balloons behind you.' }),
  Object.freeze({ id: 'turrets', name: 'Auto-Targeting Turrets', slot: 'secondary-1', group: 'specialized',
    price: 2200, unlockSector: 3, intervalMs: 800, projectiles: 2, targeting: 'nearest', damage: 1, projectileSpeed: 380, projectilePattern: 'turrets', projectileColor: 0x92e9ff, projectileRadius: 4, range: 300,
    description: 'Two wing turrets track nearby targets automatically.' }),
  Object.freeze({ id: 'flak', name: 'Flak Guns', slot: 'secondary-1', group: 'specialized',
    price: 2800, unlockSector: 4, intervalMs: 1100, projectiles: 2, targeting: 'straight', damage: 1, projectileSpeed: 360, projectilePattern: 'wings', splashRadius: 45, projectileColor: 0xffc76d, projectileWidth: 8, projectileHeight: 12,
    description: 'Explosive wing rounds damage nearby balloon groups.' }),
  Object.freeze({ id: 'tracking', name: 'Tracking Launcher', slot: 'secondary-2', group: 'general',
    price: 1000, unlockSector: 1, intervalMs: 1500, projectiles: 1, targeting: 'nearest', damage: 1, projectileSpeed: 320, projectilePattern: 'center', projectileColor: 0xb69cff, projectileRadius: 5,
    range: 220, description: 'Guided missiles track nearby balloons.' })
]);
export const getWeapon = id => WEAPON_REGISTRY.find(weapon => weapon.id === id) ?? null;
export const weaponsIn = (slot, group) =>
  WEAPON_REGISTRY.filter(weapon => weapon.slot === slot && weapon.group === group);
