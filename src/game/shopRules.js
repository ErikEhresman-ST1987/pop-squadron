import { readWallet, saveWallet } from './walletRules.js';
import { readOwnership, saveOwnership } from './ownershipRules.js';

export const SHOP_WEAPONS = Object.freeze([
  Object.freeze({ id: 'sides', name: 'Twin Side Guns', price: 500 }),
  Object.freeze({ id: 'tracking', name: 'Tracking Launcher', price: 1000 })
]);

export function purchaseWeapon(storage, weaponId) {
  const weapon = SHOP_WEAPONS.find(item => item.id === weaponId);
  if (!weapon) return { ok: false, reason: 'unknown' };
  const owned = readOwnership(storage);
  if (owned.includes(weaponId)) return { ok: false, reason: 'owned' };
  const balance = readWallet(storage);
  if (balance < weapon.price) return { ok: false, reason: 'funds' };
  // Save the deduction before granting ownership. If the ownership write
  // fails, attempt to restore the original balance rather than granting free gear.
  if (!saveWallet(storage, balance - weapon.price)) return { ok: false, reason: 'storage' };
  if (!saveOwnership(storage, [...owned, weaponId])) {
    const restored = saveWallet(storage, balance);
    return { ok: false, reason: restored ? 'storage' : 'recovery', balance: readWallet(storage) };
  }
  return { ok: true, balance: balance - weapon.price, owned: readOwnership(storage) };
}
