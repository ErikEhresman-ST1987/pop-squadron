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
  ]),
  // Increment 8.3 — modest rise beyond Mission 6; variation before the City Park boss.
  mission(7, 'Mission 7: Crosswinds', 'Tactical', [
    wave(1200, 'drift', 11, 111, ['basic', 'durable', 'layered']),
    wave(13700, 'formation', 12, 119, ['durable', 'basic', 'layered']),
    wave(26400, 'drift', 13, 124, ['layered', 'basic', 'durable']),
    wave(39100, 'formation', 14, 130, ['durable', 'layered', 'basic']),
    wave(51800, 'drift', 15, 135, ['layered', 'durable', 'basic']),
    wave(64500, 'formation', 16, 139, ['durable', 'basic', 'layered'])
  ]),
  mission(8, 'Mission 8: Balloon Barrage', 'Intense', [
    wave(1200, 'formation', 12, 116, ['basic', 'durable', 'layered']),
    wave(12000, 'drift', 12, 124, ['durable', 'layered', 'basic']),
    wave(22800, 'formation', 13, 130, ['layered', 'basic', 'durable']),
    wave(33600, 'drift', 14, 136, ['durable', 'layered', 'basic']),
    wave(44400, 'formation', 15, 140, ['basic', 'layered', 'durable']),
    wave(55200, 'drift', 16, 144, ['durable', 'layered', 'basic'])
  ]),
  mission(9, 'Mission 9: Final Approach', 'Pre-Boss', [
    wave(1200, 'drift', 12, 119, ['durable', 'basic', 'layered']),
    wave(12200, 'formation', 13, 127, ['layered', 'durable', 'basic']),
    wave(23200, 'drift', 14, 134, ['durable', 'layered', 'basic']),
    wave(34200, 'formation', 15, 139, ['layered', 'durable', 'basic']),
    wave(45200, 'drift', 16, 143, ['durable', 'layered', 'basic']),
    wave(56200, 'formation', 17, 147, ['layered', 'durable', 'basic'])
  ]),
  mission(10, 'Mission 10: Giant Party Balloon', 'Boss', [
    wave(1200, 'formation', 7, 105, ['basic', 'durable']),
    wave(11500, 'drift', 8, 115, ['basic', 'layered', 'durable']),
    wave(22500, 'formation', 9, 120, ['durable', 'basic', 'layered'])
  ]),
  // Sector 2 — Zoo, opening mission. Reuses proven balloon types and mechanics;
  // distinctive Zoo enemy art and the sector boss belong to later increments.
  mission(11, 'Mission 11: Zoo Entrance', 'Moderate', [
    wave(1200, 'formation', 8, 98, ['basic', 'durable', 'basic']),
    wave(14200, 'drift', 9, 110, ['basic', 'layered', 'durable']),
    wave(28200, 'formation', 10, 119, ['durable', 'basic', 'layered']),
    wave(43200, 'drift', 11, 125, ['layered', 'basic', 'durable']),
    wave(58200, 'formation', 12, 132, ['basic', 'durable', 'layered'])
  ]),
  // Sector 2 — Zoo: two distinct follow-up encounters. Existing balloon
  // mechanics are retained; animal-themed art is a separate design increment.
  mission(12, 'Mission 12: Aviary Rush', 'Fast', [
    wave(1200, 'drift', 9, 112, ['basic', 'durable', 'basic']),
    wave(12000, 'formation', 10, 122, ['basic', 'layered', 'durable']),
    wave(23000, 'drift', 11, 130, ['basic', 'durable', 'layered']),
    wave(34000, 'formation', 12, 137, ['layered', 'basic', 'durable']),
    wave(45000, 'drift', 13, 143, ['basic', 'durable', 'layered'])
  ]),
  mission(13, 'Mission 13: Reptile House', 'Armored', [
    wave(1200, 'formation', 10, 110, ['durable', 'layered', 'basic']),
    wave(13300, 'drift', 11, 120, ['layered', 'durable', 'basic']),
    wave(25400, 'formation', 12, 128, ['durable', 'layered', 'durable', 'basic']),
    wave(37500, 'drift', 13, 134, ['layered', 'durable', 'basic']),
    wave(49600, 'formation', 14, 140, ['durable', 'layered', 'durable']),
    wave(61700, 'drift', 15, 146, ['layered', 'durable', 'basic'])
  ])
]);

export function getMission(id) {
  return MISSIONS.find(mission => mission.id === id) ?? null;
}
