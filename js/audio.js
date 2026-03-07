// ── Audio engine (Web Audio API — no external files needed) ──────────────────

let _ctx = null;
let _muted = false;
let _musicPlaying = false;
let _musicLoop = null;

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  return _ctx;
}

/** Resume context and run fn(ctx) synchronously. */
function withRunningCtx(fn) {
  const ctx = getCtx();
  if (!ctx) return;
  ctx.resume();   // no-op if already running; triggers unlock on user gesture
  fn(ctx);        // schedule audio nodes immediately — they play once ctx is running
}

/** Play a single tone */
function tone(ctx, freq, startTime, duration, type = 'sine', vol = 0.25) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

// ── Sound effects ─────────────────────────────────────────────────────────────

/** Ascending 4-note fanfare on game start */
export function playGameStart() {
  if (_muted) return;
  withRunningCtx(ctx => {
    const t = ctx.currentTime;
    [261.6, 329.6, 392.0, 523.3].forEach((freq, i) => {
      tone(ctx, freq, t + i * 0.15, 0.45, 'triangle', 0.28);
    });
  });
}

/** Short click tick for countdown (last 10 s) */
export function playTimerTick() {
  if (_muted) return;
  withRunningCtx(ctx => {
    tone(ctx, 900, ctx.currentTime, 0.06, 'square', 0.18);
  });
}

/** Descending alarm when time runs out */
export function playTimeUp() {
  if (_muted) return;
  withRunningCtx(ctx => {
    const t = ctx.currentTime;
    [440, 392, 349, 311].forEach((freq, i) => {
      tone(ctx, freq, t + i * 0.12, 0.25, 'sawtooth', 0.22);
    });
  });
}

/** Upward chime when a point is awarded */
export function playPointAwarded() {
  if (_muted) return;
  withRunningCtx(ctx => {
    const t = ctx.currentTime;
    [523.3, 659.3, 783.9].forEach((freq, i) => {
      tone(ctx, freq, t + i * 0.11, 0.3, 'sine', 0.22);
    });
  });
}

// ── Background music ──────────────────────────────────────────────────────────
// Soft looping chord progression: C  Am  F  G

const CHORDS = [
  [261.6, 329.6, 392.0],   // C major
  [220.0, 261.6, 329.6],   // A minor
  [174.6, 220.0, 261.6],   // F major
  [196.0, 246.9, 293.7],   // G major
];

export function startBackgroundMusic() {
  if (_musicPlaying) return;
  _musicPlaying = true;
  let i = 0;

  function next() {
    if (!_musicPlaying) return;
    withRunningCtx(ctx => {
      const t = ctx.currentTime;
      CHORDS[i % CHORDS.length].forEach(freq => {
        tone(ctx, freq * 0.5, t, 1.6, 'sine', 0.055);
      });
      i++;
    });
    _musicLoop = setTimeout(next, 1900);
  }

  next();
}

export function stopBackgroundMusic() {
  _musicPlaying = false;
  if (_musicLoop !== null) {
    clearTimeout(_musicLoop);
    _musicLoop = null;
  }
}

// ── Mute toggle ───────────────────────────────────────────────────────────────

export function toggleMute() {
  _muted = !_muted;
  if (_muted) stopBackgroundMusic();
  return _muted;
}

export function isMuted() {
  return _muted;
}

/** Call on first user interaction to unlock AudioContext on iOS/Chrome */
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
