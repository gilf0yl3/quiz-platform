const canvas = document.getElementById('bg-canvas');
const ctx    = canvas.getContext('2d');

const SYMBOLS = ['?', '★', '✦', '!', '◆'];
const COLORS  = [
  'rgba(139,92,246,VAL)',   // violet
  'rgba(99,179,237,VAL)',   // sky
  'rgba(252,129,74,VAL)',   // orange
  'rgba(72,199,142,VAL)',   // green
  'rgba(246,173,85,VAL)',   // yellow
  'rgba(237,100,166,VAL)',  // pink
];

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(true); }

  reset(initial = false) {
    this.x      = Math.random() * canvas.width;
    this.y      = initial ? Math.random() * canvas.height : canvas.height + 60;
    this.r      = 18 + Math.random() * 28;
    this.speed  = 0.3 + Math.random() * 0.6;
    this.drift  = (Math.random() - 0.5) * 0.4;
    this.alpha  = 0.12 + Math.random() * 0.18;
    this.symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    this.color  = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.pulse  = Math.random() * Math.PI * 2;
  }

  update() {
    this.y     -= this.speed;
    this.x     += this.drift;
    this.pulse += 0.02;
    const scale = 1 + Math.sin(this.pulse) * 0.06;
    this.displayR = this.r * scale;
    if (this.y < -80) this.reset();
  }

  draw() {
    const fill   = this.color.replace('VAL', this.alpha);
    const stroke = this.color.replace('VAL', this.alpha * 1.6);

    ctx.save();
    ctx.translate(this.x, this.y);

    // bubble
    ctx.beginPath();
    ctx.arc(0, 0, this.displayR, 0, Math.PI * 2);
    ctx.fillStyle   = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = 1.5;
    ctx.fill();
    ctx.stroke();

    // symbol
    ctx.fillStyle   = stroke;
    ctx.font        = `bold ${Math.round(this.displayR * 0.85)}px Inter,sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.fillText(this.symbol, 0, 0);

    ctx.restore();
  }
}

const COUNT = Math.min(40, Math.floor(window.innerWidth / 28));
const particles = Array.from({ length: COUNT }, () => new Particle());

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(loop);
}

resize();
window.addEventListener('resize', () => {
  resize();
  particles.forEach(p => { if (p.x > canvas.width) p.reset(); });
});

loop();
