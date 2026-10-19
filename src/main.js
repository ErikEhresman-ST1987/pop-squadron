import Phaser from 'phaser';
import './style.css';
import { setupOffline } from './offline.js';
import { MissionRules } from './game/missionRules.js';
import { MISSIONS, getMission } from './game/missionDefinitions.js';
import { createBalloonState, hitBalloon, removeBalloon, balloonAppearance } from './game/balloonRules.js';
import { initialWeaponState, advanceWeapons } from './game/weaponRules.js';
import { SLOTS, readLoadout, saveLoadout } from './game/loadoutRules.js';
import { readProgress, saveProgress, isMissionUnlocked, completeMission } from './game/progressionRules.js';
import { rewardForBalloon, addReward } from './game/currencyRules.js';

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
    this.cameras.main.setBackgroundColor('#142c42');
    const grid = this.add.graphics().setDepth(-2);
    grid.lineStyle(1, 0x3d6582, 0.4);
    for (let x = 45; x < WIDTH; x += 45) grid.lineBetween(x, 0, x, HEIGHT);
    for (let y = 40; y < HEIGHT; y += 40) grid.lineBetween(0, y, WIDTH, y);
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
  balloonColor(type, removed) {
    if (type === 'layered') return [0x9c86f5, 0x55bfe5, 0xff779a][removed];
    if (type === 'durable') return [0xf9be63, 0xe89848, 0xc66b42][removed];
    return 0xff779a;
  }
  damageBalloon(balloon) {
    const result = hitBalloon(balloon.state);
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
    if (volley.weaponId === 'tracking') {
      const target = this.balloons.get(volley.targetId);
      if (!target) return;
      const shape = this.add.circle(this.aircraft.x, this.aircraft.y - 18, 5, 0xb69cff).setDepth(3);
      this.shots.push({ shape, kind: 'tracking', targetId: volley.targetId, lifetime: 0 });
      return;
    }
    const offsets = volley.weaponId === 'sides' ? [-24, 24] : [0];
    for (const offset of offsets) {
      const shape = this.add.rectangle(this.aircraft.x + offset, this.aircraft.y - 25,
        volley.weaponId === 'sides' ? 4 : 4, volley.weaponId === 'sides' ? 12 : 15,
        volley.weaponId === 'sides' ? 0xffc979 : 0xb3f7ff).setDepth(3);
      this.shots.push({ shape, kind: 'straight', lifetime: 0 });
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
      this.missionEarnings = addReward(this.missionEarnings, rewardForBalloon(balloon.state.type, kind));
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
    document.getElementById('status').textContent = outcome==='victory'?'Mission complete':'Mission failed';
    document.getElementById('replay').hidden = false;
    document.getElementById('return-hangar').hidden = false;
  }
  update(_time, delta) {
    if (this.finished) return;
    const dt = Math.min(delta,50)/1000;
    this.elapsed += delta;
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
    const firing = advanceWeapons(this.weaponState, delta,
      { x: this.aircraft.x, y: this.aircraft.y },
      [...this.balloons.values()].map(balloon => ({ id: balloon.id, x: balloon.circle.x, y: balloon.circle.y, resolved: balloon.state.resolved })), this.equippedWeaponIds);
    this.weaponState = firing.state;
    for (const volley of firing.volleys) this.fireVolley(volley);
    for (let i=this.shots.length-1;i>=0;i--) {
      const shot=this.shots[i];
      shot.lifetime += dt;
      if (shot.kind === 'tracking') {
        const target = this.balloons.get(shot.targetId);
        if (!target || shot.lifetime > 3) { this.removeShot(i); continue; }
        const dx = target.circle.x - shot.shape.x;
        const dy = target.circle.y - shot.shape.y;
        const distance = Math.hypot(dx, dy);
        const step = 320 * dt;
        if (distance > 0) {
          shot.shape.x += dx / distance * Math.min(step, distance);
          shot.shape.y += dy / distance * Math.min(step, distance);
        }
      } else {
        shot.shape.y -= 440 * dt;
      }
      if (shot.shape.y < -20 || shot.shape.y > HEIGHT+20 || shot.shape.x < -20 || shot.shape.x > WIDTH+20) {
        this.removeShot(i); continue;
      }
      let hit=null;
      const candidates = shot.kind === 'tracking'
        ? [this.balloons.get(shot.targetId)].filter(Boolean)
        : this.balloons.values();
      for (const balloon of candidates) {
        const tolerance = shot.kind === 'tracking' ? 5 : 2;
        if (Math.abs(shot.shape.x-balloon.circle.x)<balloon.circle.radius+tolerance &&
            Math.abs(shot.shape.y-balloon.circle.y)<balloon.circle.radius+(shot.kind === 'tracking' ? 5 : 7)) {
          hit=balloon;break;
        }
      }
      if (hit) {
        this.removeShot(i);
        this.damageBalloon(hit);
      }
    }
    for (const balloon of [...this.balloons.values()]) {
      balloon.age+=dt;
      balloon.circle.y+=balloon.speed*balloonAppearance(balloon.state).speedMultiplier*dt;
      if (balloon.pattern==='drift') balloon.circle.x=clamp(balloon.originX+Math.sin(balloon.age*2+balloon.phase)*34,15,WIDTH-15);
      if (balloon.circle.y>HEIGHT+balloon.circle.radius) {this.resolveBalloon(balloon,'escape');continue;}
      if (this.elapsed>=this.invulnerableUntil && Math.hypot(balloon.circle.x-this.aircraft.x,balloon.circle.y-this.aircraft.y)<balloon.circle.radius+12) this.resolveBalloon(balloon,'collision');
    }
    if (this.aircraft.alpha<1 && this.elapsed>=this.invulnerableUntil) this.aircraft.alpha=1;
    const result=this.rules.checkVictory(this.waveIndex===this.mission.waves.length,this.balloons.size);
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
let selectedMissionId = 1;
let progress = readProgress(window.localStorage);
let loadout = readLoadout(window.localStorage);
let game;

function renderMissions() {
  missionList.replaceChildren();
  for (const mission of MISSIONS) {
    const available = isMissionUnlocked(progress, mission.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mission-choice';
    button.disabled = !available;
    button.setAttribute('aria-pressed', String(available && mission.id === selectedMissionId));
    button.textContent = mission.name + ' · ' + mission.difficulty + (available ? '' : ' · Locked');
    if (available) button.addEventListener('click', () => {
      selectedMissionId = mission.id;
      renderMissions();
    });
    missionList.append(button);
  }
  if (!isMissionUnlocked(progress, selectedMissionId)) selectedMissionId = 1;
  launch.textContent = 'Launch ' + getMission(selectedMissionId).name;
}

function renderSlots() {
  slotContainer.replaceChildren();
  for (const slot of SLOTS) {
    const row = document.createElement('div');
    row.className = 'weapon-slot';
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = slot.label;
    const name = document.createElement('span');
    name.textContent = slot.name;
    details.append(title, name);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'equipment-toggle';
    const equipped = loadout[slot.id] === slot.weaponId;
    toggle.textContent = equipped ? 'Equipped' : 'Unequipped';
    toggle.setAttribute('aria-pressed', String(equipped));
    toggle.setAttribute('aria-label', slot.name + ': ' + (equipped ? 'equipped' : 'unequipped'));
    toggle.addEventListener('click', () => {
      loadout = { ...loadout, [slot.id]: equipped ? null : slot.weaponId };
      saveStatus.textContent = saveLoadout(window.localStorage, loadout)
        ? 'Equipment saved on this device'
        : 'Storage unavailable: equipment may not persist';
      renderSlots();
    });
    row.append(details, toggle);
    slotContainer.append(row);
  }
}
function showHangar() {
  hangar.hidden = false;
  gameElement.hidden = true;
  instructions.hidden = true;
  document.getElementById('replay').hidden = true;
  returnHangar.hidden = true;
  document.getElementById('status').textContent = 'Hangar ready';
  if (game) game.scene.stop('FlightScene');
  renderMissions();
}
launch.addEventListener('click', () => {
  if (!isMissionUnlocked(progress, selectedMissionId)) return;
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

function createGame() {
  return new Phaser.Game({
  type:Phaser.AUTO,parent:'game',width:WIDTH,height:HEIGHT,backgroundColor:'#142c42',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:WIDTH,height:HEIGHT},
  render:{pixelArt:false,antialias:true},scene:[FlightScene]
  });
}

setupOffline();
