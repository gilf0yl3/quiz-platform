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

/** Two-note "ding-dong" cue when a new question appears */
export function playNewQuestion() {
  if (_muted) return;
  withRunningCtx(ctx => {
    const t = ctx.currentTime;
    tone(ctx, 880, t,        0.12, 'sine', 0.2);
    tone(ctx, 1318.5, t + 0.14, 0.18, 'sine', 0.18);
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

let _currentTrack = null;  // 'lobby' | 'game'

function stopMusicLoop() {
  _musicPlaying = false;
  _currentTrack = null;
  if (_musicLoop !== null) {
    clearTimeout(_musicLoop);
    _musicLoop = null;
  }
}

// — Lobby music: upbeat bouncy chiptune for welcome & team screens —

// Kick drum: short noise burst at low frequency
function kick(ctx, t) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.15);
}

// Snare: noise-like burst
function snare(ctx, t) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  src.buffer = buf;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  gain.gain.setValueAtTime(0.18, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  src.start(t);
}

// Bright staccato melody — C major pentatonic, two octaves up from game music
const LOBBY_SEQ = [
  1046.5,  // C6
  1174.7,  // D6
  1318.5,  // E6
  1568.0,  // G6
  1318.5,  // E6
  1568.0,  // G6
  1760.0,  // A6
  1568.0,  // G6
  1046.5,  // C6
  1318.5,  // E6
  1174.7,  // D6
  1046.5,  // C6
];

const STEP = 0.2;   // seconds per beat (~300 BPM feel)

export function startLobbyMusic() {
  if (_musicPlaying && _currentTrack === 'lobby') return;
  stopMusicLoop();
  _musicPlaying = true;
  _currentTrack = 'lobby';
  let step = 0;

  function next() {
    if (!_musicPlaying || _currentTrack !== 'lobby') return;
    withRunningCtx(ctx => {
      const t = ctx.currentTime;
      const beat = step % 8;

      // Drums: kick on 0,4 — snare on 2,6
      if (beat === 0 || beat === 4) kick(ctx, t);
      if (beat === 2 || beat === 6) snare(ctx, t);

      // Melody note (short, staccato)
      const freq = LOBBY_SEQ[step % LOBBY_SEQ.length];
      tone(ctx, freq, t, 0.12, 'square', 0.08);

      step++;
    });
    _musicLoop = setTimeout(next, STEP * 1000);
  }

  next();
}

// — Game music: calmer chord progression for gameplay —

const GAME_CHORDS = [
  [261.6, 329.6, 392.0],   // C major
  [220.0, 261.6, 329.6],   // A minor
  [174.6, 220.0, 261.6],   // F major
  [196.0, 246.9, 293.7],   // G major
];

export function startGameMusic() {
  if (_musicPlaying && _currentTrack === 'game') return;
  stopMusicLoop();
  _musicPlaying = true;
  _currentTrack = 'game';
  let i = 0;

  function next() {
    if (!_musicPlaying || _currentTrack !== 'game') return;
    withRunningCtx(ctx => {
      const t = ctx.currentTime;
      GAME_CHORDS[i % GAME_CHORDS.length].forEach(freq => {
        tone(ctx, freq * 0.5, t, 1.6, 'sine', 0.055);
      });
      i++;
    });
    _musicLoop = setTimeout(next, 1900);
  }

  next();
}

export function stopBackgroundMusic() {
  stopMusicLoop();
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
