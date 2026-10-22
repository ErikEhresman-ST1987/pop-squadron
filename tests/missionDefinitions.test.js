import test from 'node:test';
import assert from 'node:assert/strict';
import { MISSIONS, getMission } from '../src/game/missionDefinitions.js';
import { MISSION, MissionRules } from '../src/game/missionRules.js';
import { BALLOON_TYPES } from '../src/definitions/balloons.js';

test('twenty-nine ordered authored missions with stable lookup', () => {
  assert.deepEqual(MISSIONS.map(m => [m.id, m.difficulty]), [
    [1, 'Easy'], [2, 'Moderate'], [3, 'Challenging'],
    [4, 'Building'], [5, 'Fast'], [6, 'Armored'],
    [7, 'Tactical'], [8, 'Intense'], [9, 'Pre-Boss'], [10, 'Boss'],
    [11, 'Moderate'], [12, 'Fast'], [13, 'Armored'],
    [14, 'Tactical'], [15, 'Intense'], [16, 'Challenging'],
    [17, 'Tactical'], [18, 'Intense'], [19, 'Pre-Boss'], [20, 'Boss'],
    [21, 'Forest Entry'], [22, 'Weaving'], [23, 'Armored Weaving'],
    [24, 'Fast'], [25, 'Tactical Weaving'], [26, 'Armored Endurance'],
    [27, 'Tactical'], [28, 'Armored'], [29, 'Pre-Boss']
  ]);
  assert.equal(getMission(1), MISSION);
  assert.equal(getMission(3), MISSIONS[2]);
  assert.equal(getMission(999), null);
});

test('Mission 1 preserves the original four-wave configuration exactly', () => {
  assert.deepEqual(MISSION.waves.map(w => [w.at, w.pattern, w.count, w.speed, [...w.types]]), [
    [1200, 'formation', 5, 70, ['basic']],
    [16000, 'drift', 6, 82, ['basic', 'durable', 'basic']],
    [33000, 'formation', 7, 88, ['basic', 'layered', 'basic']],
    [52000, 'drift', 8, 96, ['durable', 'basic', 'layered', 'basic']]
  ]);
  assert.deepEqual([MISSION.health, MISSION.collisionDamage, MISSION.escapeAllowance], [100, 20, 5]);
});

test('every mission has valid increasing wave timings and supported definitions', () => {
  for (const m of MISSIONS) {
    assert.ok(m.waves.length >= ((m.id === 10 || m.id === 20) ? 3 : 4));
    assert.equal(m.health, 100);
    assert.equal(m.escapeAllowance, 5);
    let lastAt = -1;
    for (const w of m.waves) {
      assert.ok(w.at > lastAt);
      lastAt = w.at;
      assert.ok(['formation', 'drift', 'weave'].includes(w.pattern));
      assert.ok(Number.isInteger(w.count) && w.count > 0);
      assert.ok(w.speed > 0);
      assert.ok(w.types.length > 0);
      for (const type of w.types) assert.ok(BALLOON_TYPES[type]);
    }
    assert.equal(new MissionRules(m).config, m);
    assert.ok(Object.isFrozen(m) && Object.isFrozen(m.waves));
  }
});

test('later missions add pressure without changing weapon or balloon mechanics', () => {
  const counts = MISSIONS.map(m => m.waves.reduce((sum, w) => sum + w.count, 0));
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
  assert.ok(MISSIONS[1].waves.some(w => w.types.includes('layered') && w.types.includes('durable')));
  assert.ok(MISSIONS[2].waves.length > MISSIONS[1].waves.length);
});

test('Missions 4–6 retain five escapes and increase pressure in different ways', () => {
  const [four, five, six] = MISSIONS.slice(3);
  assert.deepEqual([four.name, five.name, six.name], [
    'Mission 4: The Gathering', 'Mission 5: Balloon Rush', 'Mission 6: Heavy Floaters'
  ]);
  assert.ok(four.waves.reduce((n, w) => n + w.count, 0) > MISSIONS[2].waves.reduce((n, w) => n + w.count, 0));
  assert.ok(five.waves[1].at - five.waves[0].at < four.waves[1].at - four.waves[0].at);
  assert.ok(five.waves.every(w => w.speed >= four.waves[0].speed));
  const toughShare = m => m.waves.reduce((n, w) => n + w.types.filter(t => t !== 'basic').length, 0) /
    m.waves.reduce((n, w) => n + w.types.length, 0);
  assert.ok(toughShare(six) > toughShare(five));
  for (const m of [four, five, six]) assert.equal(m.escapeAllowance, 5);
});

test('Missions 7–9 have five escapes, supported waves and a modest pressure increase', () => {
  const [six, seven, eight, nine] = MISSIONS.slice(5);
  assert.deepEqual([seven.name, eight.name, nine.name], [
    'Mission 7: Crosswinds', 'Mission 8: Balloon Barrage', 'Mission 9: Final Approach'
  ]);
  const count = m => m.waves.reduce((n, w) => n + w.count, 0);
  assert.ok(count(six) < count(seven) && count(seven) < count(eight) && count(eight) < count(nine));
  assert.ok(eight.waves[1].at - eight.waves[0].at < seven.waves[1].at - seven.waves[0].at);
  assert.ok(nine.waves.at(-1).speed > eight.waves.at(-1).speed);
  for (const m of [seven, eight, nine]) assert.equal(m.escapeAllowance, 5);
});

test('Zoo opening mission is playable and preserves the established combat rules', () => {
  const zoo = getMission(11);
  assert.equal(zoo.name, 'Mission 11: Zoo Entrance');
  assert.deepEqual([zoo.health, zoo.collisionDamage, zoo.escapeAllowance], [100, 20, 5]);
  assert.equal(zoo.waves.length, 5);
  assert.ok(zoo.waves.every(w => w.types.every(type => BALLOON_TYPES[type])));
  assert.equal(getMission(12)?.name, 'Mission 12: Aviary Rush');
});

test('Zoo Missions 2 and 3 increase pressure with distinct speed and armor profiles', () => {
  const [entrance, aviary, reptile] = [11, 12, 13].map(getMission);
  const total = mission => mission.waves.reduce((sum, wave) => sum + wave.count, 0);
  assert.ok(total(entrance) < total(aviary) && total(aviary) < total(reptile));
  assert.ok(aviary.waves[1].at - aviary.waves[0].at < entrance.waves[1].at - entrance.waves[0].at);
  assert.ok(aviary.waves.at(-1).speed > entrance.waves.at(-1).speed);
  const armoredShare = mission => mission.waves.reduce((n, wave) => n + wave.types.filter(type => type !== 'basic').length, 0) /
    mission.waves.reduce((n, wave) => n + wave.types.length, 0);
  assert.ok(armoredShare(reptile) > armoredShare(aviary));
  for (const mission of [aviary, reptile]) {
    assert.equal(mission.escapeAllowance, 5);
    assert.equal(mission.health, 100);
    assert.equal(mission.collisionDamage, 20);
  }
  assert.equal(getMission(21)?.name, 'Mission 21: Into the Woods');
});


test('Zoo Missions 14–16 have distinct escalating wave profiles and preserve combat rules', () => {
  const [monkey, safari, night] = [14, 15, 16].map(getMission);
  assert.deepEqual([monkey.name, safari.name, night.name], [
    'Mission 14: Monkey Business', 'Mission 15: Safari Stampede', 'Mission 16: Night at the Zoo'
  ]);
  const count = mission => mission.waves.reduce((sum, wave) => sum + wave.count, 0);
  assert.ok(count(getMission(13)) < count(monkey));
  assert.ok(count(monkey) < count(safari) && count(safari) < count(night));
  assert.ok(safari.waves[1].at - safari.waves[0].at < monkey.waves[1].at - monkey.waves[0].at);
  assert.ok(night.waves.length > safari.waves.length);
  for (const mission of [monkey, safari, night]) {
    assert.deepEqual([mission.health, mission.collisionDamage, mission.escapeAllowance], [100, 20, 5]);
    assert.ok(mission.waves.some(wave => wave.pattern === 'drift'));
    assert.ok(mission.waves.some(wave => wave.pattern === 'formation'));
    assert.ok(mission.waves.every(wave => wave.types.every(type => BALLOON_TYPES[type])));
  }
});


test('Zoo Missions 17–19 escalate crowd pressure and speed without changing combat rules', () => {
  const [night, feeding, uprising, escape] = [16, 17, 18, 19].map(getMission);
  assert.deepEqual([feeding.name, uprising.name, escape.name], [
    'Mission 17: Feeding Frenzy', 'Mission 18: Animal Uprising', 'Mission 19: The Great Escape'
  ]);
  const total = m => m.waves.reduce((sum, wave) => sum + wave.count, 0);
  assert.ok(total(night) < total(feeding) && total(feeding) < total(uprising) && total(uprising) < total(escape));
  assert.ok(uprising.waves[1].at - uprising.waves[0].at < feeding.waves[1].at - feeding.waves[0].at);
  assert.ok(escape.waves.length > uprising.waves.length);
  assert.ok(escape.waves.at(-1).speed > uprising.waves.at(-1).speed);
  for (const mission of [feeding, uprising, escape]) {
    assert.deepEqual([mission.health, mission.collisionDamage, mission.escapeAllowance], [100, 20, 5]);
    assert.ok(mission.waves.some(w => w.pattern === 'drift'));
    assert.ok(mission.waves.some(w => w.pattern === 'formation'));
    assert.ok(mission.waves.every(w => w.types.every(type => BALLOON_TYPES[type])));
  }
  assert.equal(getMission(22)?.name, 'Mission 22: Winding Paths');
});


test('Zoo boss has three opening waves and preserves five-escape rule', () => {
  const boss = getMission(20);
  assert.equal(boss.name, 'Mission 20: The Mutant Menagerie');
  assert.equal(boss.waves.length, 3);
  assert.deepEqual([boss.health, boss.collisionDamage, boss.escapeAllowance], [100, 20, 5]);
});

test('Forest weaving is introduced only in Mission 22 and keeps standard combat rules', () => {
  const entry = getMission(21), winding = getMission(22);
  assert.ok(entry.waves.every(w => w.pattern !== 'weave'));
  assert.ok(winding.waves.some(w => w.pattern === 'weave'));
  for (const m of [entry, winding]) assert.deepEqual([m.health, m.collisionDamage, m.escapeAllowance], [100, 20, 5]);
  assert.equal(getMission(31), null);
});


test('Mission 23 combines durable balloons and weaving without changing core rules', () => {
  const winding = getMission(22), thicker = getMission(23);
  assert.equal(thicker.name, 'Mission 23: Thicker Skins');
  assert.deepEqual([thicker.health, thicker.collisionDamage, thicker.escapeAllowance], [100, 20, 5]);
  assert.ok(thicker.waves.some(w => w.pattern === 'weave' && w.types.includes('durable')));
  assert.ok(thicker.waves.some(w => w.pattern === 'formation'));
  assert.ok(thicker.waves.some(w => w.pattern === 'drift'));
  assert.ok(thicker.waves.reduce((n, w) => n + w.count, 0) > winding.waves.reduce((n, w) => n + w.count, 0));
  assert.ok(thicker.waves.every(w => w.types.every(type => BALLOON_TYPES[type])));
  assert.equal(getMission(31), null);
});


test('Deep Forest Missions 24–26 offer speed, weaving, then armored endurance', () => {
  const [rush, crosswinds, tangled] = [24, 25, 26].map(getMission);
  const total = m => m.waves.reduce((n, w) => n + w.count, 0);
  assert.deepEqual([rush.name, crosswinds.name, tangled.name], [
    'Mission 24: Forest Rush', 'Mission 25: Crosswinds', 'Mission 26: Tangled Trouble'
  ]);
  assert.ok(rush.waves.every((w, i, waves) => i === 0 || w.at - waves[i - 1].at === 10000));
  assert.ok(rush.waves.at(-1).speed > getMission(23).waves.at(-1).speed);
  assert.ok(crosswinds.waves.filter(w => w.pattern === 'weave').length >= 3);
  assert.ok(crosswinds.waves.some(w => w.pattern === 'drift'));
  assert.ok(tangled.waves.length > crosswinds.waves.length);
  assert.ok(total(tangled) > total(crosswinds) && total(crosswinds) > total(rush));
  assert.ok(tangled.waves.some(w => w.pattern === 'weave' && w.types.includes('layered')));
  for (const m of [rush, crosswinds, tangled]) {
    assert.deepEqual([m.health, m.collisionDamage, m.escapeAllowance], [100, 20, 5]);
    assert.ok(m.waves.every(w => w.types.every(type => BALLOON_TYPES[type])));
  }
  assert.equal(getMission(31), null);
});


test('Forest Missions 27–29 build toward boss using only existing balloons', () => {
  const [ambush, patrol, deep] = [27, 28, 29].map(getMission);
  assert.deepEqual([ambush.name, patrol.name, deep.name], [
    'Mission 27: Canopy Ambush', 'Mission 28: Thorn Patrol', 'Mission 29: Deep Woods'
  ]);
  const count = m => m.waves.reduce((n, w) => n + w.count, 0);
  assert.ok(count(getMission(26)) < count(ambush));
  assert.ok(count(ambush) < count(patrol) && count(patrol) < count(deep));
  assert.ok(ambush.waves.some((w, i, waves) => i > 0 && w.at - waves[i - 1].at === 8000));
  assert.ok(patrol.waves.every(w => w.types.filter(t => t !== 'basic').length >= 2));
  assert.ok(deep.waves.length > patrol.waves.length);
  assert.ok(deep.waves.some(w => w.pattern === 'weave'));
  assert.ok(deep.waves.at(-1).at > patrol.waves.at(-1).at);
  assert.equal(count(deep), 118);
  assert.ok(deep.waves.every((w, i, waves) => i === 0 || w.at - waves[i - 1].at === 12000));
  assert.ok(Math.max(...deep.waves.map(w => w.speed)) <= 158);
  for (const m of [ambush, patrol, deep]) {
    assert.deepEqual([m.health, m.collisionDamage, m.escapeAllowance], [100, 20, 5]);
    assert.ok(m.waves.every(w => ['formation', 'drift', 'weave'].includes(w.pattern)));
    assert.ok(m.waves.every(w => w.types.every(t => BALLOON_TYPES[t])));
  }
  assert.equal(getMission(31), null);
});


test('Thornback is the authored Forest boss with a short opening and existing balloon types', () => {
  const boss = getMission(30);
  assert.equal(boss.name, 'Mission 30: Thornback');
  assert.equal(boss.difficulty, 'Boss');
  assert.equal(boss.waves.length, 3);
  assert.deepEqual([boss.health, boss.collisionDamage, boss.escapeAllowance], [100, 20, 5]);
  assert.ok(boss.waves.every(w => w.types.every(t => BALLOON_TYPES[t])));
  assert.equal(getMission(31), null);
});
