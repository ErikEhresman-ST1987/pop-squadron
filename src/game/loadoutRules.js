import { WEAPONS } from './weaponRules.js';

export const LOADOUT_KEY = 'pop-squadron-loadout-v1';
export const SLOTS = Object.freeze([
  Object.freeze({ id: 'primary', label: 'Primary', weaponId: 'forward', name: 'Forward Cannon' }),
  Object.freeze({ id: 'secondary-1', label: 'Secondary 1', weaponId: 'sides', name: 'Twin Side Guns' }),
  Object.freeze({ id: 'secondary-2', label: 'Secondary 2', weaponId: 'tracking', name: 'Tracking Launcher' })
]);

export function defaultLoadout() {
  return Object.fromEntries(SLOTS.map(slot => [slot.id, slot.weaponId]));
}

export function normalizeLoadout(value) {
  const result = defaultLoadout();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const slot of SLOTS) {
    const selected = value[slot.id];
    if (selected === null || (selected === slot.weaponId && WEAPONS[selected]?.slot === slot.id)) {
      result[slot.id] = selected;
    }
  }
  return result;
}

export function readLoadout(storage) {
  try {
    const saved = storage.getItem(LOADOUT_KEY);
    return saved === null ? defaultLoadout() : normalizeLoadout(JSON.parse(saved));
  } catch {
    return defaultLoadout();
  }
}

export function saveLoadout(storage, value) {
  const normalized = normalizeLoadout(value);
  try {
    storage.setItem(LOADOUT_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}
