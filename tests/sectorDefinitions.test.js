import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTORS, MISSIONS_PER_SECTOR, getSector, getSectorForMission, isBossMission, isSectorUnlocked } from '../src/game/sectorDefinitions.js';

test('ten approved sectors cover exactly 100 missions', () => {
  assert.equal(SECTORS.length, 10);
  assert.equal(MISSIONS_PER_SECTOR, 10);
  assert.deepEqual(SECTORS.map(s => s.name), ['City Park', 'Zoo', 'Forest', 'Beach', 'Desert', 'Mountains', 'Farmland', 'Industrial Zone', 'Major City', 'Balloon Stronghold']);
  assert.deepEqual(SECTORS.map(s => s.boss), ['Giant Party Balloon', 'Mutant Animal Balloon', 'Thorn-Armored Balloon', 'Inflatable Sea Monster', 'Heat-Resistant Balloon', 'Armored Weather Balloon', 'Balloon Swarm Queen', 'Mechanical Balloon', 'Balloon Warship', 'Supreme Balloon Commander']);
  for (const s of SECTORS) {
    assert.equal(s.firstMissionId, (s.id - 1) * 10 + 1);
    assert.equal(s.lastMissionId, s.id * 10);
    assert.equal(s.bossMissionId, s.id * 10);
    assert.equal(getSector(s.id), s);
    assert.equal(getSectorForMission(s.firstMissionId), s);
    assert.equal(getSectorForMission(s.lastMissionId), s);
    assert.equal(isBossMission(s.bossMissionId), true);
    assert.equal(isBossMission(s.firstMissionId), false);
  }
});

test('invalid IDs are rejected', () => {
  for (const id of [0, -1, 11, 1.5, '1', null]) assert.equal(getSector(id), null);
  for (const id of [0, -1, 101, 2.5, '10', null]) {
    assert.equal(getSectorForMission(id), null);
    assert.equal(isBossMission(id), false);
  }
});

test('sector availability depends on preceding boss completion', () => {
  assert.equal(isSectorUnlocked(1), true);
  assert.equal(isSectorUnlocked(2), false);
  assert.equal(isSectorUnlocked(2, [9]), false);
  assert.equal(isSectorUnlocked(2, [10]), true);
  assert.equal(isSectorUnlocked(3, [10]), false);
  assert.equal(isSectorUnlocked(3, [10, 20]), true);
  assert.equal(isSectorUnlocked(10, [90]), true);
  assert.equal(isSectorUnlocked(11, [90]), false);
  assert.equal(isSectorUnlocked(2, null), false);
});
