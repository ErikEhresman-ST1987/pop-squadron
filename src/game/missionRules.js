import { MISSIONS } from './missionDefinitions.js';

// Preserve the established default mission for existing callers and tests.
export const MISSION = MISSIONS[0];

export class MissionRules {
  constructor(config = MISSION) {
    this.config = config;
    this.health = config.health;
    this.escapes = 0;
    this.popped = 0;
    this.resolved = new Set();
    this.outcome = null;
  }
  // Boss contact is damage without resolving a balloon or incrementing escapes.
  damageAircraft(amount = this.config.collisionDamage) {
    if (this.outcome) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.outcome = 'defeat';
    return true;
  }
  resolve(id, kind) {
    if (this.outcome || this.resolved.has(id)) return false;
    if (!['pop', 'escape', 'collision'].includes(kind)) return false;
    this.resolved.add(id);
    if (kind === 'pop') this.popped++;
    if (kind === 'escape') this.escapes++;
    if (kind === 'collision') this.damageAircraft();
    if (this.health === 0 || this.escapes > this.config.escapeAllowance) this.outcome = 'defeat';
    return true;
  }
  checkVictory(allWavesSpawned, activeCount) {
    if (!this.outcome && allWavesSpawned && activeCount === 0) this.outcome = 'victory';
    return this.outcome;
  }
}
