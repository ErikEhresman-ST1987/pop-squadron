import { WEAPON_REGISTRY } from './weaponRegistry.js';
// Ownership is independent of equipment. Existing saves migrate to the
// starting weapon only; wallet and mission progress are untouched.
export const OWNERSHIP_KEY = 'pop-squadron-weapon-ownership-v1';
export const STARTING_WEAPONS = Object.freeze(['forward']);
const KNOWN = new Set(WEAPON_REGISTRY.map(weapon => weapon.id));

export function normalizeOwnership(value) {
  const owned = new Set(STARTING_WEAPONS);
  if (Array.isArray(value)) {
    for (const id of value) if (KNOWN.has(id)) owned.add(id);
  }
  return [...owned];
}

export function readOwnership(storage) {
  try {
    const raw = storage?.getItem(OWNERSHIP_KEY);
    return raw === null || raw === undefined ? normalizeOwnership(null) : normalizeOwnership(JSON.parse(raw));
  } catch {
    return normalizeOwnership(null);
  }
}

export function saveOwnership(storage, value) {
  try {
    if (!storage) return false;
    storage.setItem(OWNERSHIP_KEY, JSON.stringify(normalizeOwnership(value)));
    return true;
  } catch {
    return false;
  }
}
