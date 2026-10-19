import { WEAPONS } from './weaponRules.js';
import { STARTING_WEAPONS } from './ownershipRules.js';

export const LOADOUT_KEY = 'pop-squadron-loadout-v1';
export const SLOTS = Object.freeze([
  Object.freeze({ id: 'primary', label: 'Primary', weaponId: 'forward', name: 'Forward Cannon' }),
  Object.freeze({ id: 'secondary-1', label: 'Secondary 1', weaponId: 'sides', name: 'Twin Side Guns' }),
  Object.freeze({ id: 'secondary-2', label: 'Secondary 2', weaponId: 'tracking', name: 'Tracking Launcher' })
]);

export function defaultLoadout() {
  return Object.fromEntries(SLOTS.map(slot => [slot.id, STARTING_WEAPONS.includes(slot.weaponId) ? slot.weaponId : null]));
}

export function normalizeLoadout(value, ownedWeapons = STARTING_WEAPONS) {
  const result = defaultLoadout();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const slot of SLOTS) {
    const selected = value[slot.id];
    if (selected === null || (selected === slot.weaponId && ownedWeapons.includes(selected) && WEAPONS[selected]?.slot === slot.id)) {
      result[slot.id] = selected;
    }
  }
  return result;
}

export function readLoadout(storage, ownedWeapons = STARTING_WEAPONS) {
  try {
    const saved = storage.getItem(LOADOUT_KEY);
    return saved === null ? defaultLoadout() : normalizeLoadout(JSON.parse(saved), ownedWeapons);
  } catch {
    return defaultLoadout();
  }
}

export function saveLoadout(storage, value, ownedWeapons = STARTING_WEAPONS) {
  const normalized = normalizeLoadout(value, ownedWeapons);
  try {
    storage.setItem(LOADOUT_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}
