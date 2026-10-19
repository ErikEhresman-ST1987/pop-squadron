export const MISSION = Object.freeze({
  health: 100, collisionDamage: 20, escapeAllowance: 5,
  waves: [
    { at: 1200, pattern: 'formation', count: 5, speed: 70, types: ['basic'] },
    { at: 16000, pattern: 'drift', count: 6, speed: 82, types: ['basic', 'durable', 'basic'] },
    { at: 33000, pattern: 'formation', count: 7, speed: 88, types: ['basic', 'layered', 'basic'] },
    { at: 52000, pattern: 'drift', count: 8, speed: 96, types: ['durable', 'basic', 'layered', 'basic'] }
  ]
});

export class MissionRules {
  constructor(config = MISSION) {
    this.config = config;
    this.health = config.health;
    this.escapes = 0;
    this.popped = 0;
    this.resolved = new Set();
    this.outcome = null;
  }
  resolve(id, kind) {
    if (this.outcome || this.resolved.has(id)) return false;
    if (!['pop', 'escape', 'collision'].includes(kind)) return false;
    this.resolved.add(id);
    if (kind === 'pop') this.popped++;
    if (kind === 'escape') this.escapes++;
    if (kind === 'collision') this.health = Math.max(0, this.health - this.config.collisionDamage);
    if (this.health === 0 || this.escapes > this.config.escapeAllowance) this.outcome = 'defeat';
    return true;
  }
  checkVictory(allWavesSpawned, activeCount) {
    if (!this.outcome && allWavesSpawned && activeCount === 0) this.outcome = 'victory';
    return this.outcome;
  }
}
