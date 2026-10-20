// Deterministic, lightweight scenery: drawn once into a texture, not animated objects.
// Every feature wraps vertically so the tile repeats without a visible join.
export const SCENERY_WIDTH = 360;
export const SCENERY_HEIGHT = 640;
export const SCROLL_SPEED = 35;

export function sceneryTheme(missionId) {
  return missionId >= 11 ? 'zoo' : 'park';
}

export function drawScenery(ctx, theme, width = SCENERY_WIDTH, height = SCENERY_HEIGHT) {
  const zoo = theme === 'zoo';
  const scaleX = width / SCENERY_WIDTH;
  const scaleY = height / SCENERY_HEIGHT;
  ctx.save();
  ctx.scale(scaleX, scaleY);
  const h = SCENERY_HEIGHT;
  const grass = zoo ? '#8da96b' : '#91bd7b';
  ctx.fillStyle = grass;
  ctx.fillRect(0, 0, 360, h);

  // Subtle repeating ground bands: no per-frame noise or particles.
  for (let y = 0; y < h; y += 32) {
    ctx.fillStyle = y % 64 === 0 ? (zoo ? '#88a568' : '#8ab675') : (zoo ? '#92ae71' : '#98c482');
    ctx.fillRect(0, y, 360, 32);
  }

  // A winding path whose phase is exactly periodic at the texture boundary.
  const center = y => 165 + 37 * Math.sin(y * Math.PI * 2 / h) + 15 * Math.sin(y * Math.PI * 4 / h);
  ctx.beginPath();
  for (let y = -2; y <= h + 2; y += 4) {
    const x = center(y) - (zoo ? 17 : 14);
    if (y === -2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let y = h + 2; y >= -2; y -= 4) ctx.lineTo(center(y) + (zoo ? 17 : 14), y);
  ctx.closePath();
  ctx.fillStyle = '#6d8658';
  ctx.fill();
  ctx.beginPath();
  for (let y = -2; y <= h + 2; y += 4) {
    const x = center(y) - (zoo ? 13 : 10);
    if (y === -2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  for (let y = h + 2; y >= -2; y -= 4) ctx.lineTo(center(y) + (zoo ? 13 : 10), y);
  ctx.closePath();
  ctx.fillStyle = zoo ? '#d8c29a' : '#e1cda3';
  ctx.fill();

  // Each landmark is drawn with vertical wrap copies, including edge overlaps.
  const wrapped = (y, draw) => {
    for (const offset of [-h, 0, h]) draw(y + offset);
  };
  const ellipse = (x, y, rx, ry, color) => {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  };
  if (!zoo) {
    wrapped(290, y => {
      ellipse(285, y + 5, 61, 83, '#78a88b');
      ellipse(285, y, 56, 77, '#609fb1');
      ellipse(274, y - 15, 32, 48, '#79b5c0');
    });
    wrapped(515, y => {
      ellipse(66, y, 38, 22, '#a9c78a');
      for (let i = 0; i < 8; i++) ellipse(44 + (i % 4) * 14, y - 8 + Math.floor(i / 4) * 15, 3, 3, i % 2 ? '#f4db8b' : '#e7a5a1');
    });
  } else {
    wrapped(300, y => {
      ctx.fillStyle = '#b6a17a';
      ctx.fillRect(220, y - 90, 114, 170);
      ctx.fillStyle = '#a3bd7d';
      ctx.fillRect(226, y - 84, 102, 158);
      ctx.strokeStyle = '#6e7552';
      ctx.lineWidth = 4;
      ctx.strokeRect(220, y - 90, 114, 170);
      ellipse(274, y + 12, 30, 22, '#c9b58c');
      ellipse(273, y + 9, 22, 14, '#d6c7a6');
    });
    wrapped(530, y => {
      ellipse(70, y, 45, 30, '#b4c67d');
      ellipse(70, y, 28, 18, '#c4d294');
    });
  }
  const trees = zoo
    ? [[40, 70, 20], [312, 110, 23], [60, 220, 17], [328, 415, 21], [48, 480, 19], [310, 585, 20]]
    : [[42, 80, 21], [309, 70, 23], [59, 195, 19], [321, 430, 20], [47, 405, 23], [310, 565, 19]];
  for (const [x, y, r] of trees) wrapped(y, yy => {
    ellipse(x + 3, yy + 5, r + 2, r + 2, '#648e62');
    ellipse(x, yy, r, r, zoo ? '#487d52' : '#438e58');
    ellipse(x - 5, yy - 6, r * .62, r * .6, zoo ? '#6d9d64' : '#6aaa6b');
  });
  // Small sparse ground marks, deterministic and inexpensive.
  for (let i = 0; i < 40; i++) {
    const x = (i * 79 + 19) % 360;
    const y = (i * 113 + 47) % h;
    ctx.fillStyle = i % 3 ? '#79a76e' : '#b1cc91';
    ctx.fillRect(x, y, 3, 5);
  }
  ctx.restore();
}
