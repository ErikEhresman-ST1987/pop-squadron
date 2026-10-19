import Phaser from 'phaser';
import './style.css';

const WIDTH = 360;
const HEIGHT = 640;
const AIRCRAFT_SPEED = 265;
const EDGE = 18;

class FlightScene extends Phaser.Scene {
  constructor() { super('FlightScene'); }

  create() {
    // Temporary geometric flight-test visuals, not approved production artwork.
    this.cameras.main.setBackgroundColor('#142c42');
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x3d6582, 0.45);
    for (let x = 45; x < WIDTH; x += 45) graphics.lineBetween(x, 0, x, HEIGHT);
    for (let y = 40; y < HEIGHT; y += 40) graphics.lineBetween(0, y, WIDTH, y);

    this.aircraft = this.add.container(WIDTH / 2, HEIGHT * 0.77);
    const hull = this.add.graphics();
    hull.fillStyle(0x55c7ef, 1);
    hull.lineStyle(2, 0xe0f7ff, 1);
    hull.fillTriangle(0, -23, -16, 19, 16, 19);
    hull.strokeTriangle(0, -23, -16, 19, 16, 19);
    hull.fillStyle(0x277da5, 1);
    hull.fillTriangle(-28, 10, -9, -1, -9, 20);
    hull.fillTriangle(28, 10, 9, -1, 9, 20);
    this.aircraft.add(hull);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.dragPointer = null;
    this.previousPointer = null;
    this.input.on('pointerdown', (pointer) => {
      if (this.dragPointer !== null) return;
      this.dragPointer = pointer.id;
      this.previousPointer = { x: pointer.x, y: pointer.y };
    });
    this.input.on('pointermove', (pointer) => {
      if (pointer.id !== this.dragPointer || !pointer.isDown || !this.previousPointer) return;
      const dx = pointer.x - this.previousPointer.x;
      const dy = pointer.y - this.previousPointer.y;
      this.aircraft.x = Phaser.Math.Clamp(this.aircraft.x + dx, EDGE + 12, WIDTH - EDGE - 12);
      this.aircraft.y = Phaser.Math.Clamp(this.aircraft.y + dy, EDGE + 12, HEIGHT - EDGE - 12);
      this.previousPointer = { x: pointer.x, y: pointer.y };
    });
    const release = (pointer) => {
      if (pointer.id === this.dragPointer) { this.dragPointer = null; this.previousPointer = null; }
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
    window.addEventListener('blur', () => { this.dragPointer = null; this.previousPointer = null; }, { signal: this.blurController.signal });
    document.getElementById('status').textContent = 'Flight controls ready · No weapons or balloons yet';
  }

  init() { this.blurController = new AbortController(); }
  shutdown() { this.blurController.abort(); }

  update(_time, delta) {
    const k = this.keys;
    const horizontal = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    const vertical = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    if (!horizontal && !vertical) return;
    const magnitude = Math.hypot(horizontal, vertical);
    const distance = AIRCRAFT_SPEED * Math.min(delta, 50) / 1000 / magnitude;
    this.aircraft.x = Phaser.Math.Clamp(this.aircraft.x + horizontal * distance, EDGE + 12, WIDTH - EDGE - 12);
    this.aircraft.y = Phaser.Math.Clamp(this.aircraft.y + vertical * distance, EDGE + 12, HEIGHT - EDGE - 12);
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#142c42',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WIDTH, height: HEIGHT },
  render: { pixelArt: false, antialias: true },
  scene: [FlightScene]
});
window.addEventListener('pagehide', () => game.input?.keyboard?.resetKeys?.());
