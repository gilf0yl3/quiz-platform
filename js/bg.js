/*  Pixel-art Mario background — scrolling ground scene
    Draws everything with fillRect (pixel art, no images needed)          */

const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const S = 3; // pixel scale (each "pixel" = 3×3 real pixels)

/* ── Palette ─────────────────────────────────────────────────────────── */
const C = {
  sky:        '#5c94fc',
  ground1:    '#e86a17',
  ground2:    '#c84b00',
  grass:      '#00ab00',
  brick:      '#c84b00',
  brickLine:  '#9c3700',
  cloud:      '#ffffff',
  cloudSh:    '#c8c8c8',
  pipe:       '#00ab00',
  pipeDark:   '#007700',
  pipeCap:    '#00cc00',
  marioRed:   '#ff2020',
  marioSkin:  '#ffb870',
  marioBrown: '#8b4513',
  marioBlue:  '#0000cc',
  marioWhite: '#ffffff',
  mushCap:    '#ff2020',
  mushDot:    '#ffffff',
  mushStem:   '#ffb870',
  goombaBr:   '#a05000',
  goombaDk:   '#703000',
  goombaFt:   '#4a2000',
  coinYel:    '#ffd700',
  coinOra:    '#ffaa00',
  starYel:    '#ffff00',
  starOra:    '#ffaa00',
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function px(x, y, color, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

/* ── Sprite definitions (pixel grids) ──────────────────────────────── */

// Mario running frame A (facing right, 16×16 pixels)
const MARIO_A = [
  '....rrr.....',
  '...rrrrrr...',
  '...bbbss....',
  '..bsbssss...',
  '..bsbbssss..',
  '..bbbssss...',
  '....ssss....',
  '...rssssr...',
  '..rrssssrr..',
  '.rrsssssssr.',
  '.wssswwsssw.',
  '.wswwwwwwsw.',
  '..wwwwwwww..',
  '...www.www..',
  '..ww....ww..',
];

// Mario running frame B (legs swapped)
const MARIO_B = [
  '....rrr.....',
  '...rrrrrr...',
  '...bbbss....',
  '..bsbssss...',
  '..bsbbssss..',
  '..bbbssss...',
  '....ssss....',
  '...rssssr...',
  '..rrssssrr..',
  '.rrsssssssr.',
  '.wssswwsssw.',
  '.wswwwwwwsw.',
  '..wwwwwwww..',
  '..www.www...',
  '.ww....ww...',
];

function marioColor(ch) {
  return { r: C.marioRed, b: C.marioBlue, s: C.marioSkin,
           w: C.marioBrown, '.': null }[ch] ?? null;
}

function drawSprite(grid, ox, oy, colorFn) {
  grid.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const col = colorFn(ch);
      if (col) px(ox + c, oy + r, col);
    });
  });
}

// Mushroom (14×14)
function drawMushroom(ox, oy) {
  // cap
  const cap = [
    '..rrrrrrrrr..',
    '.rrrrrrrrrrrr',
    'rrrwwrrwwrrrr',
    'rrrwwrrrwrrrr',
    'rrrrrrrrrrrr.',
    '.rrrrrrrrrr..',
    '..rrrrrrrrr..',
  ];
  cap.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === 'r') px(ox + c, oy + r, C.mushCap);
      else if (ch === 'w') px(ox + c, oy + r, C.mushDot);
    });
  });
  // stem
  for (let r = 0; r < 5; r++) {
    px(ox + 2, oy + 7 + r, C.mushStem, 9);
    if (r === 0) { px(ox + 1, oy + 7, C.mushStem); px(ox + 11, oy + 7, C.mushStem); }
  }
  // eyes
  px(ox + 3, oy + 8, '#000', 2, 2);
  px(ox + 8, oy + 8, '#000', 2, 2);
}

// Goomba (walking)
function drawGoomba(ox, oy, frame) {
  // body
  for (let r = 2; r < 9; r++) px(ox + 1, oy + r, C.goombaBr, 10);
  // head bumps
  px(ox + 0, oy + 0, C.goombaBr, 2, 3);
  px(ox + 10, oy + 0, C.goombaBr, 2, 3);
  // eyebrows
  px(ox + 0, oy + 1, C.goombaDk, 3);
  px(ox + 9, oy + 1, C.goombaDk, 3);
  // eyes
  px(ox + 1, oy + 3, '#fff', 2, 2); px(ox + 9, oy + 3, '#fff', 2, 2);
  px(ox + 1, oy + 3, '#000', 1, 1); px(ox + 9, oy + 3, '#000', 1, 1);
  // mouth
  px(ox + 2, oy + 6, '#000', 8); px(ox + 3, oy + 7, '#000', 6);
  px(ox + 2, oy + 7, C.marioWhite); px(ox + 9, oy + 7, C.marioWhite);
  // feet
  if (frame === 0) {
    px(ox + 0, oy + 9, C.goombaFt, 5, 3); px(ox + 7, oy + 9, C.goombaFt, 5, 3);
  } else {
    px(ox + 2, oy + 9, C.goombaFt, 5, 3); px(ox + 9, oy + 9, C.goombaFt, 3, 3);
  }
}

// Pipe (w=16, h=24 pixels)
function drawPipe(ox, oy) {
  // cap
  px(ox, oy, C.pipeCap, 16, 4);
  px(ox + 1, oy + 1, C.pipe, 14, 2);
  // body
  for (let r = 4; r < 24; r++) {
    px(ox + 2, oy + r, C.pipe, 12);
    px(ox + 3, oy + r, C.pipeCap, 2);
    px(ox + 13, oy + r, C.pipeDark, 1);
  }
}

// Cloud (22×10)
function drawCloud(ox, oy) {
  const rows = [
    '......wwwww.......',
    '....wwwwwwwwww....',
    '..wwwwwwwwwwwwww..',
    '.wwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwww',
    '.WWWWWWWWWWWWWWWW.',
    '..WWWWWWWWWWWWWW..',
  ];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === 'w') px(ox + c, oy + r, C.cloud);
      else if (ch === 'W') px(ox + c, oy + r, C.cloudSh);
    });
  });
}

// Coin (spin frames)
function drawCoin(ox, oy, frame) {
  const w = [4, 3, 2, 1][frame % 4];
  const off = Math.floor((4 - w) / 2);
  for (let r = 0; r < 8; r++) {
    const col = r < 1 || r > 6 ? C.coinOra : C.coinYel;
    px(ox + off, oy + r, col, w);
  }
}

/* ── Scene state ─────────────────────────────────────────────────────── */
let W, H, groundY;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  groundY = Math.floor(H / S) - 8; // in pixel coords
}

let scroll    = 0;
let frame     = 0;
let tick      = 0;
const FPS     = 12;
let lastTime  = 0;

// Static scene objects (in pixel-space x coords, relative to scroll=0)
const SCENE_W = 320; // tile world loops every this many pixels

const pipes = [{ x: 80 }, { x: 220 }];
const clouds = [{ x: 20, y: 10 }, { x: 140, y: 6 }, { x: 260, y: 14 }];
const mushrooms = [{ x: 110, y: groundY - 13 }, { x: 280, y: groundY - 13 }];
const goombas = [{ x: 160 }, { x: 300 }];
const coins   = [{ x: 60, y: groundY - 22 }, { x: 200, y: groundY - 22 }];

const MARIO_X = 20; // Mario stays fixed; world scrolls

/* ── Ground tiles ─────────────────────────────────────────────────────── */
function drawGround() {
  const cols = Math.ceil(W / S / 16) + 2;
  const offX = Math.floor(scroll) % 16;
  for (let c = -1; c < cols; c++) {
    const tx = c * 16 - offX;
    // top green row
    px(tx, groundY, C.grass, 16, 1);
    // orange dirt
    for (let r = 1; r < 8; r++) {
      px(tx, groundY + r, r % 2 === 0 ? C.ground1 : C.ground2, 16);
    }
    // brick lines
    px(tx, groundY + 2, C.brickLine, 16, 1);
    px(tx, groundY + 5, C.brickLine, 16, 1);
    const lineOff = c % 2 === 0 ? 8 : 0;
    px(tx + lineOff, groundY + 1, C.brickLine, 1, 2);
    px(tx + lineOff + 8, groundY + 1, C.brickLine, 1, 2);
    px(tx + (lineOff === 0 ? 4 : 12), groundY + 3, C.brickLine, 1, 2);
  }
}

/* ── Wrap x coord so scene tiles repeat ─────────────────────────────── */
function sceneX(baseX) {
  // returns screen pixel x from world pixel x
  return ((baseX - Math.floor(scroll)) % SCENE_W + SCENE_W) % SCENE_W;
}

/* ── Main draw ───────────────────────────────────────────────────────── */
function draw() {
  // Sky
  ctx.fillStyle = C.sky;
  ctx.fillRect(0, 0, W, H);

  // Clouds (two copies for seamless wrap)
  clouds.forEach(cl => {
    for (let rep = -1; rep <= 1; rep++) {
      const sx = sceneX(cl.x + rep * SCENE_W);
      drawCloud(sx, cl.y);
    }
  });

  // Pipes
  pipes.forEach(p => {
    for (let rep = -1; rep <= 1; rep++) {
      const sx = sceneX(p.x + rep * SCENE_W);
      drawPipe(sx, groundY - 24);
    }
  });

  // Coins
  coins.forEach(cn => {
    for (let rep = -1; rep <= 1; rep++) {
      const sx = sceneX(cn.x + rep * SCENE_W);
      drawCoin(sx, cn.y, Math.floor(tick / 2) % 4);
    }
  });

  // Mushrooms
  mushrooms.forEach(m => {
    for (let rep = -1; rep <= 1; rep++) {
      const sx = sceneX(m.x + rep * SCENE_W);
      drawMushroom(sx, groundY - 13);
    }
  });

  // Goombas
  goombas.forEach(g => {
    for (let rep = -1; rep <= 1; rep++) {
      const sx = sceneX(g.x + rep * SCENE_W);
      drawGoomba(sx, groundY - 12, frame);
    }
  });

  // Ground
  drawGround();

  // Mario (fixed position, world scrolls)
  drawSprite(frame === 0 ? MARIO_A : MARIO_B, MARIO_X, groundY - 15, marioColor);
}

/* ── Loop ────────────────────────────────────────────────────────────── */
function loop(ts) {
  requestAnimationFrame(loop);
  const dt = ts - lastTime;
  if (dt < 1000 / FPS) return;
  lastTime = ts;

  scroll += 1.5;  // scroll speed in pixel-space pixels per frame
  if (scroll >= SCENE_W) scroll -= SCENE_W;

  tick++;
  frame = Math.floor(tick / 3) % 2;

  draw();
}

resize();
window.addEventListener('resize', resize);
requestAnimationFrame(loop);
