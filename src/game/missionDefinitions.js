// Authored mission configurations. Checkpoint 5.1 defines missions but does not
// expose mission selection or progression; Mission 1 remains the active mission.
const wave = (at, pattern, count, speed, types) => Object.freeze({
  at, pattern, count, speed, types: Object.freeze(types)
});
const mission = (id, name, difficulty, waves) => Object.freeze({
  id, name, difficulty, health: 100, collisionDamage: 20, escapeAllowance: 5,
  waves: Object.freeze(waves)
});

export const MISSIONS = Object.freeze([
  mission(1, 'Mission 1', 'Easy', [
    wave(1200, 'formation', 5, 70, ['basic']),
    wave(16000, 'drift', 6, 82, ['basic', 'durable', 'basic']),
    wave(33000, 'formation', 7, 88, ['basic', 'layered', 'basic']),
    wave(52000, 'drift', 8, 96, ['durable', 'basic', 'layered', 'basic'])
  ]),
  mission(2, 'Mission 2', 'Moderate', [
    wave(1200, 'formation', 6, 78, ['basic', 'durable']),
    wave(15500, 'drift', 8, 90, ['basic', 'durable', 'layered']),
    wave(31500, 'formation', 8, 97, ['durable', 'basic', 'layered']),
    wave(48500, 'drift', 9, 103, ['layered', 'basic', 'durable', 'basic'])
  ]),
  mission(3, 'Mission 3', 'Challenging', [
    wave(1200, 'drift', 8, 88, ['basic', 'durable', 'layered']),
    wave(14500, 'formation', 9, 102, ['durable', 'layered', 'basic']),
    wave(29000, 'drift', 10, 110, ['layered', 'durable', 'basic']),
    wave(44500, 'formation', 11, 118, ['durable', 'layered', 'durable', 'basic']),
    wave(61000, 'drift', 12, 125, ['layered', 'durable', 'basic', 'layered'])
  ]),
  // Sector 1 — City Park: growing pressure, faster waves, then tougher balloons.
  mission(4, 'Mission 4: The Gathering', 'Building', [
    wave(1200, 'formation', 9, 94, ['basic', 'durable', 'layered']),
    wave(14000, 'drift', 10, 103, ['basic', 'durable', 'basic', 'layered']),
    wave(27000, 'formation', 11, 109, ['durable', 'layered', 'basic']),
    wave(40000, 'drift', 12, 115, ['basic', 'layered', 'durable', 'basic']),
    wave(54000, 'formation', 13, 121, ['durable', 'basic', 'layered'])
  ]),
  mission(5, 'Mission 5: Balloon Rush', 'Fast', [
    wave(1200, 'drift', 10, 112, ['basic', 'durable', 'layered']),
    wave(10500, 'formation', 11, 122, ['basic', 'layered', 'durable']),
    wave(20500, 'drift', 12, 132, ['durable', 'basic', 'layered']),
    wave(30500, 'formation', 12, 138, ['basic', 'durable', 'layered']),
    wave(41000, 'drift', 13, 144, ['layered', 'basic', 'durable']),
    wave(52500, 'formation', 14, 148, ['basic', 'durable', 'layered'])
  ]),
  mission(6, 'Mission 6: Heavy Floaters', 'Armored', [
    wave(1200, 'formation', 10, 102, ['durable', 'layered', 'durable', 'basic']),
    wave(13500, 'drift', 12, 111, ['layered', 'durable', 'basic', 'durable']),
    wave(26500, 'formation', 13, 119, ['durable', 'layered', 'durable']),
    wave(40500, 'drift', 14, 126, ['layered', 'durable', 'basic', 'layered']),
    wave(55000, 'formation', 15, 132, ['durable', 'layered', 'durable', 'basic']),
    wave(70000, 'drift', 16, 138, ['layered', 'durable', 'layered', 'basic'])
  ])
]);

export function getMission(id) {
  return MISSIONS.find(mission => mission.id === id) ?? null;
}
