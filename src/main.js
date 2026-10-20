import Phaser from 'phaser';
import { drawScenery, sceneryTheme, SCENERY_WIDTH, SCENERY_HEIGHT, SCROLL_SPEED } from './game/scenery.js';
import './style.css';
import { setupOffline } from './offline.js';
import { MissionRules } from './game/missionRules.js';
import { getMission } from './game/missionDefinitions.js';
import { SECTORS, getSector, getSectorForMission } from './game/sectorDefinitions.js';
import { createBalloonState, hitBalloon, removeBalloon, balloonAppearance } from './game/balloonRules.js';
import { initialWeaponState, advanceWeapons } from './game/weaponRules.js';
import { projectileSpecs, moveProjectile } from './game/projectileRules.js';
import { getWeapon } from './game/weaponRegistry.js';
import { WEAPON_CATEGORIES, WEAPON_GROUPS, weaponsIn } from './game/weaponRegistry.js';
import { SLOTS, readLoadout, saveLoadout } from './game/loadoutRules.js';
import { readOwnership } from './game/ownershipRules.js';
import { SHOP_WEAPONS, purchaseWeapon } from './game/shopRules.js';
import { readProgress, saveProgress, isMissionUnlocked, completeMission } from './game/progressionRules.js';
import { rewardForBalloon, addReward } from './game/currencyRules.js';
import { readWallet, creditWallet } from './game/walletRules.js';
import { CITY_PARK_BOSS, bossHit, bossPhase, bossReward, bossAttackPosition, ZOO_BOSS, zooBossPhase, zooBossRadius, zooBossPosition, zooEscortInterval, zooAttackTiming, zooAttackPosition } from './game/bossRules.js';

const WIDTH = 360, HEIGHT = 640, SPEED = 265, LIMIT = 30;
const clamp = (value, low, high) => Phaser.Math.Clamp(value, low, high);

class FlightScene extends Phaser.Scene {
  constructor() { super('FlightScene'); }
  create() {
    this.mission = getMission(selectedMissionId); // Selection is captured at mission start.
    this.rules = new MissionRules(this.mission);
    this.missionEarnings = 0;
    this.elapsed = 0;
    this.waveIndex = 0;
    this.nextId = 1;
    this.balloons = new Map();
    this.shots = [];
    this.weaponState = initialWeaponState();
    // Snapshot equipment on mission start; hangar edits apply only to the next mission.
    this.equippedWeaponIds = SLOTS.map(slot => loadout[slot.id]).filter(Boolean);
    this.invulnerableUntil = 0;
    this.finished = false;
    this.boss = null;
    this.bossSpawned = false;
    this.nextReinforcementAt = Infinity;
    this.cameras.main.setBackgroundColor('#91bd7b');
    // Generate a single seamless texture per sector; scroll it as one background.
    const theme = sceneryTheme(this.mission.id);
    const textureKey = 'scenery-' + theme;
    if (!this.textures.exists(textureKey)) {
      const canvasTexture = this.textures.createCanvas(textureKey, SCENERY_WIDTH, SCENERY_HEIGHT);
      drawScenery(canvasTexture.context, theme);
      canvasTexture.refresh();
    }
    this.scenery = this.add.tileSprite(0, 0, WIDTH, HEIGHT, textureKey)
      .setOrigin(0, 0).setDepth(-2);
    this.aircraft = this.add.container(WIDTH / 2, HEIGHT * .77).setDepth(4);
    const hull = this.add.graphics();
    hull.fillStyle(0x55c7ef).lineStyle(2, 0xe0f7ff);
    hull.fillTriangle(0, -23, -16, 19, 16, 19);
    hull.strokeTriangle(0, -23, -16, 19, 16, 19);
    hull.fillStyle(0x277da5);
    hull.fillTriangle(-28, 10, -9, -1, -9, 20);
    hull.fillTriangle(28, 10, 9, -1, 9, 20);
    this.aircraft.add(hull);
    this.hud = this.add.text(12, 10, '', { fontFamily:'system-ui',fontSize:'15px',color:'#f3f7ff',backgroundColor:'#091522aa',padding:{x:7,y:5} }).setDepth(8);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.dragPointer = null;
    this.previousPointer = null;
    this.input.on('pointerdown', pointer => {
      if (this.finished || this.dragPointer !== null) return;
      this.dragPointer = pointer.id;
      this.previousPointer = {x:pointer.x,y:pointer.y};
    });
    this.input.on('pointermove', pointer => {
      if (this.finished || pointer.id !== this.dragPointer || !pointer.isDown || !this.previousPointer) return;
      this.aircraft.x = clamp(this.aircraft.x + pointer.x - this.previousPointer.x, LIMIT, WIDTH-LIMIT);
      this.aircraft.y = clamp(this.aircraft.y + pointer.y - this.previousPointer.y, LIMIT, HEIGHT-LIMIT);
      this.previousPointer = {x:pointer.x,y:pointer.y};
    });
    const release = pointer => {
      if (pointer.id === this.dragPointer) {this.dragPointer=null;this.previousPointer=null;}
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    this.blurHandler = () => {this.dragPointer=null;this.previousPointer=null;};
    window.addEventListener('blur', this.blurHandler);
    this.events.once('shutdown', () => window.removeEventListener('blur', this.blurHandler));
    this.updateHud();
    document.getElementById('status').textContent = this.mission.name + ' · Automatic fire enabled';
    const replay = document.getElementById('replay');
    replay.hidden = true;
    replay.onclick = () => this.scene.restart();
  }
  spawnWave(wave) {
    for (let i=0; i<wave.count; i++) {
      const x = wave.pattern === 'formation' ? 40 + i * (280 / Math.max(1,wave.count-1)) : 40 + ((i*73+this.waveIndex*29)%280);
      const y = -28 - i*42;
      const id = this.nextId++;
      const type = wave.types ? wave.types[i % wave.types.length] : 'basic';
      const state = createBalloonState(id, type);
      const stage = balloonAppearance(state);
      const circle = this.add.circle(x,y,stage.radius,this.balloonColor(type,0)).setStrokeStyle(2,0xfff4d6).setDepth(2);
      this.balloons.set(id,{id,state,circle,originX:x,age:0,speed:wave.speed,pattern:wave.pattern,phase:i*1.6});
    }
  }
  spawnBoss() {
    this.bossSpawned = true;
    const zoo = this.mission.id === 20;
    const config = zoo ? ZOO_BOSS : CITY_PARK_BOSS;
    const shape = this.add.circle(WIDTH / 2, 105, config.radius, zoo ? 0xb4db73 : 0xf27ab9)
      .setStrokeStyle(5, 0xffe59b).setDepth(3);
    this.boss = { shape, health: config.health, age: 0, attack: { startX: WIDTH / 2, targetX: WIDTH / 2 }, lastPhase: 'patrol' };
    this.bossWarning = this.add.text(WIDTH / 2, 190, 'DIVE INCOMING!', { fontFamily: 'system-ui', fontSize: '18px', fontStyle: 'bold', color: '#ffdd76' }).setOrigin(.5).setDepth(9).setVisible(false);
    this.bossLabel = this.add.text(WIDTH / 2, 35, zoo ? 'THE MUTANT MENAGERIE' : 'GIANT PARTY BALLOON',
      { fontFamily: 'system-ui', fontSize: '15px', color: '#fff0c9' }).setOrigin(.5).setDepth(9);
    this.bossBar = this.add.rectangle(WIDTH / 2, 55, 250, 12, 0x6de2a6).setDepth(9);
    if (zoo) this.nextReinforcementAt = this.elapsed + zooEscortInterval('awakens');
  }
  hitBoss(damage = 1) {
    if (!this.boss) return;
    this.boss.health = bossHit(this.boss.health, damage);
    const zoo = this.mission.id === 20;
    const config = zoo ? ZOO_BOSS : CITY_PARK_BOSS;
    this.bossBar.width = 250 * this.boss.health / config.health;
    if (zoo) {
      const phase = zooBossPhase(this.boss.health);
      this.boss.shape.setRadius(zooBossRadius(this.boss.health));
      this.boss.shape.setFillStyle(phase === 'last-gasp' ? 0xf6b77a : phase === 'going-wild' ? 0xe0dd73 : 0xb4db73);
    }
    if (!zoo && bossPhase(this.boss.health) === 'reinforcements' &&
        !Number.isFinite(this.nextReinforcementAt))
      this.nextReinforcementAt = this.elapsed + 2500;
    if (this.boss.health === 0) {
      this.boss.shape.destroy();
      this.bossBar.destroy();
      this.bossLabel.destroy();
      this.bossWarning.destroy();
      this.boss = null;
      for (const balloon of this.balloons.values()) balloon.circle.destroy();
      this.balloons.clear();
      this.finish('victory');
    }
  }
  balloonColor(type, removed) {
    if (type === 'layered') return [0x9c86f5, 0x55bfe5, 0xff779a][removed];
    if (type === 'durable') return [0xf9be63, 0xe89848, 0xc66b42][removed];
    return 0xff779a;
  }
  damageBalloon(balloon, damage = 1) {
    const result = hitBalloon(balloon.state, damage);
    if (result.event === 'ignored') return;
    balloon.state = result.state;
    if (result.event === 'pop') {
      this.resolveBalloon(balloon, 'pop');
      return;
    }
    const removed = balloon.state.remainingHits;
    const stage = balloonAppearance(balloon.state);
    balloon.circle.setRadius(stage.radius);
    balloon.circle.setFillStyle(this.balloonColor(balloon.state.type, 3 - removed));
    balloon.circle.setStrokeStyle(3,0xffffff);
    // The same balloon object keeps its position, movement pattern and identity.
  }
  fireVolley(volley) {
    const weapon = getWeapon(volley.weaponId);
    if (!weapon) return;
    const specs = projectileSpecs(weapon, { x: this.aircraft.x, y: this.aircraft.y }, volley.targetId);
    for (const spec of specs) {
      const shape = spec.kind === 'tracking'
        ? this.add.circle(spec.x, spec.y, spec.radius, spec.color).setDepth(3)
        : this.add.rectangle(spec.x, spec.y, spec.width, spec.height, spec.color).setDepth(3);
      this.shots.push({ shape, kind: spec.kind, targetId: spec.targetId,
        speed: spec.speed, damage: spec.damage, piercing: spec.piercing, splashRadius: spec.splashRadius, hitIds: new Set(), vx: spec.vx, vy: spec.vy, lifetime: 0 });
    }
  }
  removeShot(index) {
    this.shots[index].shape.destroy();
    this.shots.splice(index, 1);
  }
  resolveBalloon(balloon, kind) {
    if (kind !== 'pop') {
      const result = removeBalloon(balloon.state,kind);
      if (result.event === 'ignored') return;
      balloon.state = result.state;
    }
    if (!this.rules.resolve(balloon.id,kind)) return;
    if (kind === 'pop') {
      const reward = rewardForBalloon(balloon.state.type, kind);
      this.missionEarnings = addReward(this.missionEarnings, reward);
      const credited = creditWallet(window.localStorage, walletBalance, reward);
      walletBalance = credited.balance;
      walletSaved = credited.saved;
    }
    balloon.circle.destroy();
    this.balloons.delete(balloon.id);
    if (kind === 'collision') {
      this.invulnerableUntil = this.elapsed + 750;
      this.aircraft.alpha = .5;
    }
    this.updateHud();
  }
  updateHud() {
    this.hud.setText('HP '+this.rules.health+'   Escapes '+this.rules.escapes+'/'+this.mission.escapeAllowance+'\nPopped '+this.rules.popped+'   Wave '+Math.min(this.waveIndex+1,this.mission.waves.length)+'/'+this.mission.waves.length+'\nMission Earnings '+String.fromCharCode(36)+this.missionEarnings);
  }
  finish(outcome) {
    if (this.finished) return;
    this.finished = true;
    for (const shot of this.shots) shot.shape.destroy();
    this.shots = [];
    this.dragPointer = null;
    this.previousPointer = null;
    this.aircraft.alpha = 1;
    if (outcome === 'victory' && this.mission.id === 20) {
      const credited = creditWallet(window.localStorage, walletBalance, 1500);
      walletBalance = credited.balance;
      walletSaved = credited.saved;
      this.missionEarnings = addReward(this.missionEarnings, 1500);
      saveStatus.textContent = 'Zoo boss defeated · Sector complete!';
    }
    if (outcome === 'victory' && this.mission.id === 10) {
      const reward = bossReward(!bossDefeated);
      const credited = creditWallet(window.localStorage, walletBalance, reward);
      walletBalance = credited.balance;
      walletSaved = credited.saved;
      this.missionEarnings = addReward(this.missionEarnings, reward);
      bossDefeated = true;
      try { localStorage.setItem(BOSS_KEY, 'true'); } catch {}
      saveStatus.textContent = 'City Park complete · New Sector Unlocked: Zoo!';
    }
    this.add.rectangle(WIDTH/2,HEIGHT/2,310,160,0x091522,.94).setDepth(10).setStrokeStyle(2,0x6aaac4);
    this.add.text(WIDTH/2,HEIGHT/2-40,outcome==='victory'?'MISSION COMPLETE':'MISSION FAILED',{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#f3f7ff'}).setOrigin(.5).setDepth(11);
    this.add.text(WIDTH/2,HEIGHT/2+12,'Popped: '+this.rules.popped+'   Escapes: '+this.rules.escapes+'\nMission Earnings: '+String.fromCharCode(36)+this.missionEarnings,{fontFamily:'system-ui',fontSize:'16px',color:'#b9d7e8',align:'center',lineSpacing:7}).setOrigin(.5).setDepth(11);
    if (outcome === 'victory') {
      const updated = completeMission(progress, this.mission.id, outcome);
      if (updated.highestUnlocked > progress.highestUnlocked) {
        progress = updated;
        saveStatus.textContent = saveProgress(window.localStorage, progress)
          ? this.mission.name + ' complete · Next mission unlocked!'
          : 'Next mission unlocked for this session; storage unavailable';
      }
    }
    document.getElementById('status').textContent = (outcome==='victory'?'Mission complete':'Mission failed') + (walletSaved ? '' : ' · Wallet storage unavailable');
    document.getElementById('replay').hidden = false;
    document.getElementById('return-hangar').hidden = false;
  }
  update(_time, delta) {
    if (this.finished) return;
    const dt = Math.min(delta,50)/1000;
    this.elapsed += delta;
    this.scenery.tilePositionY -= SCROLL_SPEED * dt;
    const k = this.keys;
    const h = Number(k.D.isDown||k.RIGHT.isDown)-Number(k.A.isDown||k.LEFT.isDown);
    const v = Number(k.S.isDown||k.DOWN.isDown)-Number(k.W.isDown||k.UP.isDown);
    if (h||v) {
      const mag = Math.hypot(h,v);
      this.aircraft.x=clamp(this.aircraft.x+h*SPEED*dt/mag,LIMIT,WIDTH-LIMIT);
      this.aircraft.y=clamp(this.aircraft.y+v*SPEED*dt/mag,LIMIT,HEIGHT-LIMIT);
    }
    while (this.waveIndex<this.mission.waves.length && this.elapsed>=this.mission.waves[this.waveIndex].at) {
      this.spawnWave(this.mission.waves[this.waveIndex]);
      this.waveIndex++;
      this.updateHud();
    }
    if ((this.mission.id === 10 || this.mission.id === 20) && !this.bossSpawned &&
        this.waveIndex === this.mission.waves.length && this.balloons.size === 0 &&
        this.elapsed >= (this.mission.id === 20 ? ZOO_BOSS : CITY_PARK_BOSS).enterAfterMs) this.spawnBoss();
    if (this.boss) {
      this.boss.age += dt;
      if (this.mission.id === 20) {
        const phase = zooBossPhase(this.boss.health);
        if (!this.boss.zooAttack) {
          const timing = zooAttackTiming(phase);
          const initial = zooBossPosition(this.boss.age * 1000, this.boss.health);
          this.boss.zooAttack = { startedAt: this.elapsed, bossAgeMs: this.boss.age * 1000,
            health: this.boss.health, timing, startX: initial.x, startY: initial.y,
            targetX: initial.x, targetY: initial.y, returnX: initial.x, returnY: initial.y,
            locked: false };
        }
        let attack = this.boss.zooAttack;
        const duration = attack.timing.patrolMs + attack.timing.warningMs +
          attack.timing.chargeMs + attack.timing.retreatMs;
        if (this.elapsed - attack.startedAt >= duration) {
          const timing = zooAttackTiming(phase);
          attack = this.boss.zooAttack = { startedAt: this.elapsed, bossAgeMs: this.boss.age * 1000,
            health: this.boss.health, timing, startX: this.boss.shape.x, startY: this.boss.shape.y,
            targetX: this.boss.shape.x, targetY: this.boss.shape.y,
            returnX: this.boss.shape.x, returnY: 130, locked: false };
        }
        const attackAge = this.elapsed - attack.startedAt;
        if (!attack.locked && attackAge >= attack.timing.patrolMs) {
          // Lock the aircraft position once; the charge never homes after warning.
          attack.startX = this.boss.shape.x;
          attack.startY = this.boss.shape.y;
          attack.targetX = this.aircraft.x;
          attack.targetY = this.aircraft.y;
          attack.returnX = clamp(attack.startX, 55, 305);
          attack.returnY = 130;
          attack.locked = true;
        }
        const position = zooAttackPosition(attackAge, attack);
        this.boss.shape.setPosition(position.x, position.y);
        this.bossWarning.setVisible(position.action === 'warning');
        if (position.action === 'warning') {
          this.bossWarning.setText('CHARGE INCOMING!');
          this.bossWarning.setPosition(clamp(attack.targetX, 90, WIDTH - 90), clamp(attack.targetY - 65, 245, HEIGHT - 45));
        }
        if (this.elapsed >= this.nextReinforcementAt) {
          this.spawnWave({ count: 3, pattern: 'drift', speed: position.phase === 'last-gasp' ? 150 : 130, types: ZOO_BOSS.reinforcementTypes });
          this.nextReinforcementAt = this.elapsed + zooEscortInterval(position.phase);
        }
      } else {
      const cycle = CITY_PARK_BOSS.patrolMs + CITY_PARK_BOSS.warningMs +
        CITY_PARK_BOSS.diveMs + CITY_PARK_BOSS.retreatMs;
      const phaseTime = (this.boss.age * 1000) % cycle;
      const phase = phaseTime < CITY_PARK_BOSS.patrolMs ? 'patrol' :
        phaseTime < CITY_PARK_BOSS.patrolMs + CITY_PARK_BOSS.warningMs ? 'warning' :
        phaseTime < CITY_PARK_BOSS.patrolMs + CITY_PARK_BOSS.warningMs + CITY_PARK_BOSS.diveMs ? 'dive' : 'retreat';
      if (phase === 'warning' && this.boss.lastPhase !== 'warning') {
        this.boss.attack = { startX: this.boss.shape.x, targetX: this.aircraft.x };
      }
      this.boss.lastPhase = phase;
      const position = bossAttackPosition(this.boss.age * 1000, this.aircraft.x, this.boss.attack);
      this.boss.shape.x = position.x;
      this.boss.shape.y = position.y;
      this.bossWarning.setVisible(phase === 'warning');
      if (phase === 'warning') this.bossWarning.setX(this.boss.attack.targetX);

      if (this.elapsed >= this.nextReinforcementAt) {
        this.spawnWave({ count: 3, pattern: 'drift', speed: 113,
          types: CITY_PARK_BOSS.reinforcementTypes });
        this.nextReinforcementAt += CITY_PARK_BOSS.reinforcementIntervalMs;
      }
      }
      if (this.elapsed >= this.invulnerableUntil &&
          Math.hypot(this.boss.shape.x - this.aircraft.x, this.boss.shape.y - this.aircraft.y) <
          (this.mission.id === 20 ? zooBossRadius(this.boss.health) : CITY_PARK_BOSS.radius) + 12) {
        this.rules.damageAircraft();
        this.invulnerableUntil = this.elapsed + 750;
        this.aircraft.alpha = .5;
        this.updateHud();
        if (this.rules.outcome) { this.finish(this.rules.outcome); return; }
      }
    }
    const firing = advanceWeapons(this.weaponState, delta,
      { x: this.aircraft.x, y: this.aircraft.y },
      [...this.balloons.values()].map(balloon => ({ id: balloon.id, x: balloon.circle.x, y: balloon.circle.y, resolved: balloon.state.resolved }))
        .concat(this.boss ? [{ id: 'boss', x: this.boss.shape.x, y: this.boss.shape.y, resolved: false }] : []),
      this.equippedWeaponIds);
    this.weaponState = firing.state;
    for (const volley of firing.volleys) this.fireVolley(volley);
    for (let i=this.shots.length-1;i>=0;i--) {
      const shot=this.shots[i];
      shot.lifetime += dt;
      if (shot.kind === 'tracking' && shot.targetId === 'boss') {
        if (!this.boss || shot.lifetime > 3) { this.removeShot(i); continue; }
        const dx = this.boss.shape.x - shot.shape.x;
        const dy = this.boss.shape.y - shot.shape.y;
        const distance = Math.hypot(dx, dy);
        const step = shot.speed * dt;
        if (distance > 0) {
          shot.shape.x += dx / distance * Math.min(step, distance);
          shot.shape.y += dy / distance * Math.min(step, distance);
        }
      } else if (shot.kind === 'tracking') {
        const target = this.balloons.get(shot.targetId);
        if (!target || shot.lifetime > 3) { this.removeShot(i); continue; }
        const dx = target.circle.x - shot.shape.x;
        const dy = target.circle.y - shot.shape.y;
        const distance = Math.hypot(dx, dy);
        const step = shot.speed * dt;
        if (distance > 0) {
          shot.shape.x += dx / distance * Math.min(step, distance);
          shot.shape.y += dy / distance * Math.min(step, distance);
        }
      } else {
        const moved = moveProjectile(shot.shape, shot, dt);
        shot.shape.x = moved.x;
        shot.shape.y = moved.y;
      }
      if (shot.shape.y < -20 || shot.shape.y > HEIGHT+20 || shot.shape.x < -20 || shot.shape.x > WIDTH+20) {
        this.removeShot(i); continue;
      }
      let hit=null;
      const candidates = shot.kind === 'tracking'
        ? [this.balloons.get(shot.targetId)].filter(Boolean)
        : this.balloons.values();
      for (const balloon of candidates) {
        if (shot.hitIds.has(balloon.id)) continue;
        const tolerance = shot.kind === 'tracking' ? 5 : 2;
        if (Math.abs(shot.shape.x-balloon.circle.x)<balloon.circle.radius+tolerance &&
            Math.abs(shot.shape.y-balloon.circle.y)<balloon.circle.radius+(shot.kind === 'tracking' ? 5 : 7)) {
          hit=balloon;break;
        }
      }
      if (hit) {
        shot.hitIds.add(hit.id);
        const blast = shot.splashRadius > 0
          ? [...this.balloons.values()].filter(b => b.id !== hit.id &&
              Math.hypot(b.circle.x - hit.circle.x, b.circle.y - hit.circle.y) <= shot.splashRadius)
          : [];
        if (!shot.piercing) this.removeShot(i);
        this.damageBalloon(hit, shot.damage);
        for (const nearby of blast) if (this.balloons.has(nearby.id)) this.damageBalloon(nearby, shot.damage);
        if (this.rules.outcome) { this.finish(this.rules.outcome); return; }
        if (this.finished) return;
      } else if (this.boss && !shot.hitIds.has('boss') &&
          Math.hypot(shot.shape.x - this.boss.shape.x, shot.shape.y - this.boss.shape.y) <
          (this.mission.id === 20 ? zooBossRadius(this.boss.health) : CITY_PARK_BOSS.radius) + 7) {
        shot.hitIds.add('boss');
        if (!shot.piercing) this.removeShot(i);
        this.hitBoss(shot.damage);
        if (this.finished) return;
      }
    }
    for (const balloon of [...this.balloons.values()]) {
      balloon.age+=dt;
      balloon.circle.y+=balloon.speed*balloonAppearance(balloon.state).speedMultiplier*dt;
      if (balloon.pattern==='drift') balloon.circle.x=clamp(balloon.originX+Math.sin(balloon.age*2+balloon.phase)*34,15,WIDTH-15);
      if (balloon.circle.y>HEIGHT+balloon.circle.radius) {
        this.resolveBalloon(balloon,'escape');
        if (this.rules.outcome) { this.finish(this.rules.outcome); return; }
        continue;
      }
      if (this.elapsed>=this.invulnerableUntil && Math.hypot(balloon.circle.x-this.aircraft.x,balloon.circle.y-this.aircraft.y)<balloon.circle.radius+12) {
        this.resolveBalloon(balloon,'collision');
        if (this.rules.outcome) { this.finish(this.rules.outcome); return; }
      }
    }
    if (this.aircraft.alpha<1 && this.elapsed>=this.invulnerableUntil) this.aircraft.alpha=1;
    const result = (this.mission.id === 10 || this.mission.id === 20) ? this.rules.outcome :
      this.rules.checkVictory(this.waveIndex === this.mission.waves.length, this.balloons.size);
    if (result) this.finish(result);
  }
}
const hangar = document.getElementById('hangar');
const gameElement = document.getElementById('game');
const instructions = document.querySelector('.instructions');
const returnHangar = document.getElementById('return-hangar');
const launch = document.getElementById('launch');
const slotContainer = document.getElementById('loadout-slots');
const saveStatus = document.getElementById('save-status');
const missionList = document.getElementById('mission-list');
const sectorSelector = document.getElementById('sector-selector');
const walletElement = document.getElementById('wallet-balance');
let walletBalance = readWallet(window.localStorage);
let walletSaved = true;
function renderWallet() {
  walletElement.textContent = 'Wallet: $' + walletBalance + (walletSaved ? '' : ' · Not saved');
}
const BOSS_KEY = 'pop-squadron-city-park-boss-v1';
let bossDefeated = false;
try { bossDefeated = localStorage.getItem(BOSS_KEY) === 'true'; } catch {}
let selectedMissionId = 1;
let progress = readProgress(window.localStorage);
let ownedWeapons = readOwnership(window.localStorage);
let loadout = readLoadout(window.localStorage, ownedWeapons);
let game;

// Zoo unlocks after the City Park boss; only authored missions can launch.
let selectedSectorId = 1;
function renderMissions() {
  sectorSelector.replaceChildren();
  const unlockedSectorIds = bossDefeated ? [1, 2] : [1];
  if (!unlockedSectorIds.includes(selectedSectorId)) selectedSectorId = 1;
  for (const sector of SECTORS.filter(item => unlockedSectorIds.includes(item.id))) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sector-choice';
    button.setAttribute('aria-pressed', String(sector.id === selectedSectorId));
    button.textContent = 'Sector ' + sector.id + ' · ' + sector.name;
    button.addEventListener('click', () => {
      selectedSectorId = sector.id;
      renderMissions();
    });
    sectorSelector.append(button);
  }
  missionList.replaceChildren();
  const sector = getSector(selectedSectorId);
  const selectedMission = getMission(selectedMissionId);
  if (!selectedMission || !isMissionUnlocked(progress, selectedMissionId) ||
      getSectorForMission(selectedMissionId)?.id !== selectedSectorId) {
    selectedMissionId = isMissionUnlocked(progress, sector.firstMissionId) && getMission(sector.firstMissionId)
      ? sector.firstMissionId : null;
  }
  for (let id = sector.firstMissionId; id <= sector.lastMissionId; id++) {
    const mission = getMission(id);
    const available = Boolean(mission) && isMissionUnlocked(progress, id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mission-choice';
    button.disabled = !available;
    button.setAttribute('aria-pressed', String(available && id === selectedMissionId));
    const label = id === sector.bossMissionId ? 'Boss' : 'Mission';
    button.textContent = label + ' ' + (id - sector.firstMissionId + 1) +
      (mission ? (available ? '' : ' · Locked') : ' · Coming soon');
    button.setAttribute('aria-label', 'Sector ' + sector.id + ', ' + button.textContent);
    if (available) button.addEventListener('click', () => {
      selectedMissionId = id;
      renderMissions();
    });
    missionList.append(button);
  }
  const active = getMission(selectedMissionId);
  launch.disabled = !active || !isMissionUnlocked(progress, selectedMissionId);
  launch.textContent = active && !launch.disabled ? 'Launch ' + active.name : 'No mission available';
}

// Category disclosure state is independent of equipment and survives re-rendering.
const expandedWeaponCategories = new Set(['primary']);
function renderSlots() {
  slotContainer.replaceChildren();
  for (const slot of SLOTS) {
    const section = document.createElement('section');
    section.className = 'weapon-category';
    const heading = document.createElement('button');
    heading.type = 'button';
    heading.className = 'weapon-category-toggle';
    const equippedWeapon = loadout[slot.id];
    const equippedName = equippedWeapon ? (weaponsIn(slot.id, 'general').concat(weaponsIn(slot.id, 'specialized')).find(w => w.id === equippedWeapon)?.name ?? equippedWeapon) : 'None equipped';
    heading.textContent = (expandedWeaponCategories.has(slot.id) ? '▾ ' : '▸ ') + slot.label + ' · ' + equippedName;
    heading.setAttribute('aria-expanded', String(expandedWeaponCategories.has(slot.id)));
    heading.addEventListener('click', () => {
      if (expandedWeaponCategories.has(slot.id)) expandedWeaponCategories.delete(slot.id);
      else expandedWeaponCategories.add(slot.id);
      renderSlots();
    });
    section.append(heading);
    if (expandedWeaponCategories.has(slot.id)) {
      for (const group of WEAPON_GROUPS) {
        const label = document.createElement('h4');
        label.className = 'weapon-group-heading';
        label.textContent = group.label;
        section.append(label);
        const options = weaponsIn(slot.id, group.id);
        if (!options.length) {
          const empty = document.createElement('p');
          empty.className = 'hangar-note';
          empty.textContent = 'No weapons available yet';
          section.append(empty);
        }
        for (const weapon of options) {
          const row = document.createElement('div');
          row.className = 'weapon-slot';
          const details = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = weapon.name;
          const description = document.createElement('span');
          description.textContent = weapon.description;
          details.append(title, description);
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'equipment-toggle';
          const owned = ownedWeapons.includes(weapon.id);
          const equipped = loadout[slot.id] === weapon.id;
          toggle.disabled = !owned;
          toggle.textContent = !owned ? 'Not owned' : equipped ? 'Equipped' : 'Equip';
          toggle.setAttribute('aria-pressed', String(equipped));
          toggle.setAttribute('aria-label', weapon.name + ': ' + toggle.textContent);
          toggle.addEventListener('click', () => {
            if (!owned) return;
            loadout = { ...loadout, [slot.id]: equipped ? null : weapon.id };
            saveStatus.textContent = saveLoadout(window.localStorage, loadout, ownedWeapons)
              ? 'Equipment saved on this device'
              : 'Storage unavailable: equipment may not persist';
            renderSlots();
          });
          row.append(details, toggle);
          section.append(row);
        }
      }
    }
    slotContainer.append(section);
  }
}
const shopElement = document.getElementById('weapon-shop');
const confirmation = document.getElementById('purchase-confirmation');
const purchaseDetails = document.getElementById('purchase-details');
let pendingPurchase = null;

function closePurchase() {
  pendingPurchase = null;
  confirmation.hidden = true;
  shopElement.after(confirmation);
}

// Shop disclosures are separate from equipment disclosures.
const expandedShopCategories = new Set(['primary']);
function renderShop() {
  shopElement.replaceChildren();
  const highestSectorUnlocked = bossDefeated ? 2 : 1;
  for (const category of WEAPON_CATEGORIES) {
    const section = document.createElement('section');
    section.className = 'weapon-category';
    const heading = document.createElement('button');
    heading.type = 'button';
    heading.className = 'weapon-category-toggle';
    const expanded = expandedShopCategories.has(category.id);
    heading.textContent = (expanded ? '▾ ' : '▸ ') + category.label;
    heading.setAttribute('aria-expanded', String(expanded));
    heading.addEventListener('click', () => {
      if (expandedShopCategories.has(category.id)) expandedShopCategories.delete(category.id);
      else expandedShopCategories.add(category.id);
      renderShop();
    });
    section.append(heading);
    if (expanded) {
      for (const group of WEAPON_GROUPS) {
        const label = document.createElement('h4');
        label.className = 'weapon-group-heading';
        label.textContent = group.label;
        section.append(label);
        const weapons = weaponsIn(category.id, group.id);
        if (!weapons.length) {
          const empty = document.createElement('p');
          empty.className = 'hangar-note';
          empty.textContent = 'No weapons available yet';
          section.append(empty);
        }
        for (const weapon of weapons) {
          const owned = ownedWeapons.includes(weapon.id);
          const locked = weapon.unlockSector > highestSectorUnlocked;
          const row = document.createElement('div');
          row.className = 'weapon-slot';
          const details = document.createElement('div');
          const title = document.createElement('strong');
          title.textContent = weapon.name;
          const description = document.createElement('span');
          description.textContent = weapon.description;
          const price = document.createElement('span');
          price.textContent = owned ? 'Permanently owned' :
            'Price: $' + weapon.price + (locked ? ' · Unlocks in Sector ' + weapon.unlockSector : '');
          details.append(title, description, price);
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'equipment-toggle';
          button.disabled = owned || locked || weapon.price === 0 || walletBalance < weapon.price;
          button.textContent = owned ? 'Owned' : locked ? 'Locked' :
            weapon.price === 0 ? 'Starter' :
            walletBalance < weapon.price ? 'Not enough funds' : 'Buy · $' + weapon.price;
          button.addEventListener('click', () => {
            if (ownedWeapons.includes(weapon.id) || locked || weapon.price === 0 || walletBalance < weapon.price) return;
            pendingPurchase = weapon.id;
            purchaseDetails.textContent = 'Purchase ' + weapon.name + ' for $' + weapon.price + '? It will remain yours permanently. Equip it separately.';
            row.after(confirmation);
            confirmation.hidden = false;
            document.getElementById('confirm-purchase').focus({ preventScroll: true });
            confirmation.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          });
          row.append(details, button);
          section.append(row);
        }
      }
    }
    shopElement.append(section);
  }
}
document.getElementById('cancel-purchase').addEventListener('click', closePurchase);
document.getElementById('confirm-purchase').addEventListener('click', () => {
  if (!pendingPurchase) return;
  const id = pendingPurchase;
  closePurchase();
  const result = purchaseWeapon(window.localStorage, id);
  if (result.ok) {
    walletBalance = result.balance;
    ownedWeapons = result.owned;
    saveStatus.textContent = 'Weapon purchased and saved · Select Equip to use it';
    renderSlots();
  } else {
    walletBalance = readWallet(window.localStorage);
    saveStatus.textContent = result.reason === 'funds' ? 'Not enough funds' :
      result.reason === 'owned' ? 'Weapon already owned' :
      result.reason === 'recovery' ? 'Purchase interrupted · Check wallet before retrying' :
      'Purchase could not be saved · No weapon unlocked';
  }
  renderWallet();
  renderShop();
});

function showHangar() {
  hangar.hidden = false;
  gameElement.hidden = true;
  instructions.hidden = true;
  document.getElementById('replay').hidden = true;
  returnHangar.hidden = true;
  document.getElementById('status').textContent = 'Hangar ready';
  if (game) game.scene.stop('FlightScene');
  closePurchase();
  renderMissions();
  renderWallet();
  renderShop();
  // Apply an already-installed update only after the mission is safely closed.
  window.dispatchEvent(new Event('pop-squadron-hangar'));
}
launch.addEventListener('click', () => {
  if (!getMission(selectedMissionId) || !isMissionUnlocked(progress, selectedMissionId) ||
      getSectorForMission(selectedMissionId)?.id !== selectedSectorId) return;
  if (!loadout.primary) {
    saveStatus.textContent = 'Equip a primary weapon before launching';
    return;
  }
  hangar.hidden = true;
  gameElement.hidden = false;
  instructions.hidden = false;
  returnHangar.hidden = true;
  if (!game) game = createGame();
  else game.scene.start('FlightScene');
});
returnHangar.addEventListener('click', showHangar);
renderSlots();
renderMissions();
renderWallet();
renderShop();

function createGame() {
  return new Phaser.Game({
  type:Phaser.AUTO,parent:'game',width:WIDTH,height:HEIGHT,backgroundColor:'#142c42',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:WIDTH,height:HEIGHT},
  render:{pixelArt:false,antialias:true},scene:[FlightScene]
  });
}

setupOffline();
