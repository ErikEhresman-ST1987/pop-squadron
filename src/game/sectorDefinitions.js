export const MISSIONS_PER_SECTOR = 10;
export const SECTORS = Object.freeze([
  ['City Park', 'Giant Party Balloon'],
  ['Zoo', 'Mutant Animal Balloon'],
  ['Forest', 'Thorn-Armored Balloon'],
  ['Beach Boardwalk', 'Inflatable Sea Monster'],
  ['Carnival', 'To be designed'],
  ['Mountains', 'Armored Weather Balloon'],
  ['Farmland', 'Balloon Swarm Queen'],
  ['Industrial Zone', 'Mechanical Balloon'],
  ['Major City', 'Balloon Warship'],
  ['Balloon Stronghold', 'Supreme Balloon Commander']
].map(([name, boss], index) => Object.freeze({
  id: index + 1,
  name,
  boss,
  firstMissionId: index * 10 + 1,
  lastMissionId: (index + 1) * 10,
  bossMissionId: (index + 1) * 10
})));
export function getSector(id) {
  return Number.isInteger(id) ? SECTORS[id - 1] ?? null : null;
}
export function getSectorForMission(id) {
  return Number.isInteger(id) && id >= 1 && id <= 100
    ? getSector(Math.ceil(id / MISSIONS_PER_SECTOR)) : null;
}
export function isBossMission(id) {
  const sector = getSectorForMission(id);
  return sector !== null && sector.bossMissionId === id;
}
export function isSectorUnlocked(id, completedBossMissionIds = []) {
  const sector = getSector(id);
  if (!sector) return false;
  if (id === 1) return true;
  return Array.isArray(completedBossMissionIds) && completedBossMissionIds.includes((id - 1) * 10);
}
