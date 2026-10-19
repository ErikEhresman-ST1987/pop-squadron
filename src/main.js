import Phaser from 'phaser';
import './style.css';
import { MISSION, MissionRules } from './game/missionRules.js';

const WIDTH = 360, HEIGHT = 640, SPEED = 265, LIMIT = 30;
const clamp = (value, low, high) => Phaser.Math.Clamp(value, low, high);

class FlightScene extends Phaser.Scene {
  constructor() { super('FlightScene'); }
  create() {
    this.rules = new MissionRules();
    this.elapsed = 0;
    this.waveIndex = 0;
    this.nextId = 1;
    this.balloons = new Map();
    this.shots = [];
    this.fireElapsed = 0;
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
    document.getElementById('status').textContent = 'Mission 1 · Automatic fire enabled';
    const replay = document.getElementById('replay');
    replay.hidden = true;
    replay.onclick = () => this.scene.restart();
  }
  spawnWave(wave) {
    for (let i=0; i<wave.count; i++) {
      const x = wave.pattern === 'formation' ? 40 + i * (280 / Math.max(1,wave.count-1)) : 40 + ((i*73+this.waveIndex*29)%280);
      const y = -28 - i*42;
      const id = this.nextId++;
      const color = wave.pattern === 'formation' ? 0xff7598 : 0xffc16b;
      const circle = this.add.circle(x,y,13,color).setStrokeStyle(2,0xfff4d6).setDepth(2);
      this.balloons.set(id,{id,circle,originX:x,age:0,speed:wave.speed,pattern:wave.pattern,phase:i*1.6});
    }
  }
  fire() {
    const bullet = this.add.rectangle(this.aircraft.x,this.aircraft.y-25,4,15,0xb3f7ff).setDepth(3);
    this.shots.push({shape:bullet});
  }
  resolveBalloon(balloon, kind) {
    if (!this.rules.resolve(balloon.id,kind)) return;
    balloon.circle.destroy();
    this.balloons.delete(balloon.id);
    if (kind === 'collision') {
      this.invulnerableUntil = this.elapsed + 750;
      this.aircraft.alpha = .5;
    }
    this.updateHud();
  }
  updateHud() {
    this.hud.setText('HP '+this.rules.health+'   Escapes '+this.rules.escapes+'/'+MISSION.escapeAllowance+'\nPopped '+this.rules.popped+'   Wave '+Math.min(this.waveIndex+1,MISSION.waves.length)+'/'+MISSION.waves.length);
  }
  finish(outcome) {
    if (this.finished) return;
    this.finished = true;
    this.dragPointer = null;
    this.previousPointer = null;
    this.aircraft.alpha = 1;
    this.add.rectangle(WIDTH/2,HEIGHT/2,310,160,0x091522,.94).setDepth(10).setStrokeStyle(2,0x6aaac4);
    this.add.text(WIDTH/2,HEIGHT/2-40,outcome==='victory'?'MISSION COMPLETE':'MISSION FAILED',{fontFamily:'system-ui',fontSize:'24px',fontStyle:'bold',color:'#f3f7ff'}).setOrigin(.5).setDepth(11);
    this.add.text(WIDTH/2,HEIGHT/2+12,'Popped: '+this.rules.popped+'   Escapes: '+this.rules.escapes,{fontFamily:'system-ui',fontSize:'16px',color:'#b9d7e8'}).setOrigin(.5).setDepth(11);
    document.getElementById('status').textContent = outcome==='victory'?'Mission complete':'Mission failed';
    document.getElementById('replay').hidden = false;
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
    while (this.waveIndex<MISSION.waves.length && this.elapsed>=MISSION.waves[this.waveIndex].at) {
      this.spawnWave(MISSION.waves[this.waveIndex]);
      this.waveIndex++;
      this.updateHud();
    }
    this.fireElapsed += delta;
    while (this.fireElapsed>=240) {this.fireElapsed-=240;this.fire();}
    for (let i=this.shots.length-1;i>=0;i--) {
      const shot=this.shots[i];
      shot.shape.y-=440*dt;
      if (shot.shape.y < -20) {shot.shape.destroy();this.shots.splice(i,1);continue;}
      let hit=null;
      for (const balloon of this.balloons.values()) {
        if (Math.abs(shot.shape.x-balloon.circle.x)<15 && Math.abs(shot.shape.y-balloon.circle.y)<20) {hit=balloon;break;}
      }
      if (hit) {
        shot.shape.destroy();this.shots.splice(i,1);
        this.resolveBalloon(hit,'pop');
      }
    }
    for (const balloon of [...this.balloons.values()]) {
      balloon.age+=dt;
      balloon.circle.y+=balloon.speed*dt;
      if (balloon.pattern==='drift') balloon.circle.x=clamp(balloon.originX+Math.sin(balloon.age*2+balloon.phase)*34,15,WIDTH-15);
      if (balloon.circle.y>HEIGHT+16) {this.resolveBalloon(balloon,'escape');continue;}
      if (this.elapsed>=this.invulnerableUntil && Math.hypot(balloon.circle.x-this.aircraft.x,balloon.circle.y-this.aircraft.y)<25) this.resolveBalloon(balloon,'collision');
    }
    if (this.aircraft.alpha<1 && this.elapsed>=this.invulnerableUntil) this.aircraft.alpha=1;
    const result=this.rules.checkVictory(this.waveIndex===MISSION.waves.length,this.balloons.size);
    if (result) this.finish(result);
  }
}
new Phaser.Game({
  type:Phaser.AUTO,parent:'game',width:WIDTH,height:HEIGHT,backgroundColor:'#142c42',
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH,width:WIDTH,height:HEIGHT},
  render:{pixelArt:false,antialias:true},scene:[FlightScene]
});
