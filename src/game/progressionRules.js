// Locally persisted, sequential mission progression. This data is independent
// of equipment selections and of any active mission's combat state.
import { MISSIONS } from './missionDefinitions.js';

export const PROGRESS_KEY = 'pop-squadron-mission-progress-v1';
export const defaultProgress = () => ({ highestUnlocked: 1 });

export function normalizeProgress(value) {
  const highest = value && typeof value === 'object' && !Array.isArray(value)
    ? value.highestUnlocked : null;
  return {
    highestUnlocked: Number.isSafeInteger(highest) && highest >= 1 && Number.isSafeInteger(highest)
      ? highest : 1
  };
}

export function readProgress(storage) {
  try {
    const saved = storage.getItem(PROGRESS_KEY);
    return saved === null ? defaultProgress() : normalizeProgress(JSON.parse(saved));
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(storage, value) {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(value)));
    return true;
  } catch {
    return false;
  }
}

export function isMissionUnlocked(progress, missionId) {
  return Number.isInteger(missionId) && missionId >= 1 &&
    missionId <= normalizeProgress(progress).highestUnlocked;
}

// Only victory on the highest currently unlocked mission can unlock the next.
// Replaying earlier missions and losing cannot revoke or advance progress.
export function completeMission(progress, missionId, outcome) {
  const current = normalizeProgress(progress);
  if (outcome !== 'victory' || !isMissionUnlocked(current, missionId)) return current;
  return { highestUnlocked: Math.max(current.highestUnlocked,
    Math.min(MISSIONS.length, missionId + 1)) };
}
