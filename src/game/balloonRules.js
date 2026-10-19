import { BALLOON_TYPES } from '../definitions/balloons.js';

// This module owns balloon hit transitions; it does not depend on Phaser.
export function createBalloonState(id, type) {
  if (!Number.isSafeInteger(id) || id < 0) throw new TypeError('Balloon id must be a nonnegative safe integer');
  const definition = BALLOON_TYPES[type];
  if (!definition) throw new RangeError('Unknown balloon type: ' + type);
  return Object.freeze({ id, type, remainingHits: definition.hits, resolved: false });
}

export function balloonAppearance(balloon) {
  const definition = BALLOON_TYPES[balloon.type];
  if (!definition) throw new RangeError('Unknown balloon type');
  const removed = definition.hits - balloon.remainingHits;
  const stage = balloon.type === 'layered' ? removed : 0;
  return definition.layers[stage] ?? definition.layers.at(-1);
}

// Returns a new state. No in-place mutations, so repeated hits on a resolved
// balloon cannot generate additional pops or layer removals.
export function hitBalloon(balloon) {
  if (balloon.resolved) return { state: balloon, event: 'ignored' };
  const remainingHits = balloon.remainingHits - 1;
  if (remainingHits <= 0) {
    return {
      state: Object.freeze({ ...balloon, remainingHits: 0, resolved: true }),
      event: 'pop'
    };
  }
  return {
    state: Object.freeze({ ...balloon, remainingHits }),
    event: balloon.type === 'layered' ? 'layer-removed' : 'damaged'
  };
}

// Escape/collision end the same balloon identity regardless of remaining layers.
// The mission controller alone decides escape totals and aircraft damage.
export function removeBalloon(balloon, reason) {
  if (!['escape', 'collision'].includes(reason)) throw new RangeError('Invalid removal reason');
  if (balloon.resolved) return { state: balloon, event: 'ignored' };
  return {
    state: Object.freeze({ ...balloon, resolved: true }),
    event: reason
  };
}
