import { addReward } from './currencyRules.js';

export const WALLET_KEY = 'pop-squadron-wallet-v1';

export function readWallet(storage) {
  try {
    const raw = storage?.getItem(WALLET_KEY);
    if (raw === null || raw === undefined) return 0;
    const value = JSON.parse(raw);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function saveWallet(storage, balance) {
  if (!Number.isSafeInteger(balance) || balance < 0) return false;
  try {
    storage?.setItem(WALLET_KEY, JSON.stringify(balance));
    return Boolean(storage);
  } catch {
    return false;
  }
}

// Credit at the moment of each completed pop, not at mission completion.
// This means defeat, replay, or leaving the mission cannot discard earned money.
export function creditWallet(storage, balance, reward) {
  const updated = addReward(balance, reward);
  return { balance: updated, saved: saveWallet(storage, updated) };
}
