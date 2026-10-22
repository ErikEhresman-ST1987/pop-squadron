// Six deterministic, seamless scenery zones. Each is drawn once and tiled by Phaser.
export const SCENERY_WIDTH = 360;
export const SCENERY_HEIGHT = 640;
export const SCROLL_SPEED = 35;

export function sceneryTheme(id) {
  if (id <= 3) return 'park-entrance';
  if (id <= 6) return 'park-recreation';
  if (id <= 10) return 'park-lakeside';
  if (id >= 21 && id <= 23) return 'forest-entrance';
  if (id >= 24 && id <= 27) return 'forest-deep';
  if (id >= 28 && id <= 30) return 'forest-thornback';
  if (id <= 13) return 'zoo-entrance';
  if (id <= 16) return 'zoo-habitats';
  return 'zoo-wildlands';
}

export function drawScenery(ctx, theme, width = SCENERY_WIDTH, height = SCENERY_HEIGHT) {
  const zoo = theme.startsWith('zoo-');
  const h = SCENERY_HEIGHT;
  ctx.save();
  ctx.scale(width / SCENERY_WIDTH, height / h);
  const fill = (x,y,w,hh,color) => { ctx.fillStyle=color; ctx.fillRect(x,y,w,hh); };
  const oval = (x,y,rx,ry,color) => {
    ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
    ctx.fillStyle=color; ctx.fill();
  };
  const line = (points,color,weight) => {
    ctx.beginPath();
    points.forEach(([x,y],i)=> i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.strokeStyle=color;ctx.lineWidth=weight;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();
  };
  // Features close to a tile boundary are copied above and below the tile.
  const wrap = (y,fn) => { for (const shift of [-h,0,h]) fn(y+shift); };
  const tree = (x,y,r=19) => {
    oval(x+4,y+6,r+3,r+2,'#638a61');
    oval(x,y,r,r,zoo?'#4b8056':'#438f58');
    oval(x-5,y-6,r*.64,r*.58,zoo?'#72a16b':'#70af73');
  };
  const pond = (x,y,rx,ry) => {
    oval(x,y+4,rx+7,ry+7,'#78a98c');
    oval(x,y,rx,ry,'#5e9fb3');
    oval(x-rx*.17,y-ry*.18,rx*.62,ry*.6,'#7bb9c7');
  };
  const fence = (x,y,w,hh) => {
    ctx.strokeStyle='#756b51';ctx.lineWidth=3;ctx.strokeRect(x,y,w,hh);
    for(let xx=x+12;xx<x+w;xx+=17){fill(xx,y-2,3,7,'#756b51');fill(xx,y+hh-5,3,7,'#756b51');}
    for(let yy=y+12;yy<y+hh;yy+=17){fill(x-2,yy,7,3,'#756b51');fill(x+w-5,yy,7,3,'#756b51');}
  };
  const hut = (x,y,w=35,hh=26) => {
    fill(x+3,y+4,w,hh,'#6d7759');
    fill(x,y,w,hh,'#c9aa78');
    line([[x-3,y+2],[x+w/2,y-12],[x+w+3,y+2]],'#8d654e',7);
  };
  const bench = (x,y) => {
    fill(x,y,25,6,'#946e51');fill(x,y+9,25,6,'#946e51');
    fill(x+3,y+15,3,5,'#615a4b');fill(x+19,y+15,3,5,'#615a4b');
  };
  const grass = zoo?'#8fae74':'#92be7e';
  fill(0,0,360,h,grass);
  for(let y=0;y<h;y+=32) fill(0,y,360,32,Math.floor(y/32)%2 ? (zoo?'#91b176':'#96c382') : (zoo?'#89a86e':'#8db979'));

  // Continuous periodic main route. The same x coordinates meet at y=0 and y=640.
  const c = y => (zoo?164:165)+34*Math.sin(y*2*Math.PI/h)+12*Math.sin(y*4*Math.PI/h);
  const path = (width,color) => {
    const pts=[];for(let y=-4;y<=h+4;y+=4)pts.push([c(y),y]);
    line(pts,color,width);
  };
  path(zoo?42:33,'#71895e');
  path(zoo?34:25,zoo?'#d7c39c':'#e4d0a6');

  if(theme==='park-entrance') {
    wrap(150,y=>{
      oval(67,y,52,74,'#7fb06f');
      for(let i=0;i<14;i++) {
        const a=i*Math.PI*2/14;
        oval(67+35*Math.cos(a),y+51*Math.sin(a),4,4,i%2?'#f5d785':'#e9a1a7');
      }
      line([[20,y+100],[86,y+100]],'#d7c59e',14);
      bench(30,y+110);
    });
    wrap(415,y=>{
      pond(290,y,42,58);
      bench(239,y+76);
      hut(36,y+18,38,28);
    });
  } else if(theme==='park-recreation') {
    wrap(150,y=>{
      oval(67,y,58,74,'#d8c78f'); // sand playground
      fill(43,y-34,46,6,'#e56d63');
      fill(48,y-29,6,38,'#df695e');fill(79,y-29,6,38,'#df695e');
      line([[86,y-2],[105,y+38]],'#e8a25a',8); // slide
      oval(51,y+42,11,7,'#86b6cf');
    });
    wrap(432,y=>{
      oval(292,y,59,94,'#a4c98c');
      for(const [dx,dy] of [[-24,-42],[18,-8],[-14,40]]) {
        fill(292+dx-12,y+dy-7,25,16,'#b8875f');
        fill(292+dx-8,y+dy+9,4,8,'#725b4a');
        fill(292+dx+6,y+dy+9,4,8,'#725b4a');
      }
      bench(246,y+71);
    });
  } else if(theme==='park-lakeside') {
    wrap(280,y=>{pond(282,y,68,121);oval(308,y+89,16,8,'#80b28a');});
    wrap(530,y=>{pond(65,y,36,53);bench(91,y+47);});
  } else if(theme==='zoo-entrance') {
    wrap(150,y=>{
      fill(214,y-88,126,170,'#d9c6a3'); // paved entrance plaza
      for(let i=0;i<5;i++)line([[219,y-65+i*30],[336,y-65+i*30]],'#c6b18e',2);
      hut(235,y-67,75,46);
      fill(252,y-13,43,26,'#9e7757'); // entrance doorway
      oval(274,y+43,22,17,'#74a9b5'); // fountain
      oval(274,y+43,10,9,'#9ed2d1');
    });
    wrap(448,y=>{
      hut(35,y-25,51,39);
      oval(74,y+75,43,25,'#b6c68d');
      bench(44,y+39);
    });
  } else if(theme==='zoo-habitats') {
    wrap(190,y=>{
      fill(219,y-108,117,205,'#b3c48a');
      fence(219,y-108,117,205);
      pond(279,y+27,30,30);
      hut(239,y-71,42,28);
      oval(298,y-50,17,13,'#bda67c');
    });
    wrap(470,y=>{
      fill(19,y-89,115,173,'#c9b68e');
      fence(19,y-89,115,173);
      oval(78,y+24,36,26,'#b3a17b');
      pond(54,y-44,20,17);
    });
  } else if(theme==='zoo-wildlands') {
    wrap(220,y=>{
      fill(209,y-131,138,257,'#b2b18a');
      fence(209,y-131,138,257);
      for(const [dx,dy,r] of [[42,-73,27],[91,-35,20],[62,42,31],[108,86,17]]) {
        oval(209+dx,y+dy,r,r*.68,'#a28e78');
        oval(203+dx,y+dy-6,r*.7,r*.43,'#c5b39a');
      }
      pond(256,y+85,24,21);
    });
    wrap(505,y=>{
      fill(14,y-89,117,167,'#83a574');
      fence(14,y-89,117,167);
      pond(70,y+17,37,30);
      hut(39,y-61,38,28);
    });
  }

  const trees = {
    'park-entrance':[[35,65,19],[315,78,21],[49,320,22],[315,570,20]],
    'park-recreation':[[38,55,20],[319,80,20],[39,348,21],[316,593,22]],
    'park-lakeside':[[37,55,25],[313,95,22],[42,175,22],[43,360,23],[318,510,24],[38,592,23]],
    'zoo-entrance':[[37,70,19],[314,70,17],[39,308,19],[310,563,20]],
    'zoo-habitats':[[37,52,20],[308,62,21],[46,343,18],[311,583,20]],
    'zoo-wildlands':[[39,60,24],[308,61,22],[41,344,25],[318,447,24],[37,602,22]]
  }[theme] || [];
  for(const [x,y,r] of trees) wrap(y,yy=>tree(x,yy,r));
  for(let i=0;i<35;i++) {
    const x=(i*79+19)%360,y=(i*113+47)%h;
    fill(x,y,3,5,i%3?'#79a76e':'#b2cb92');
  }
  ctx.restore();
}
