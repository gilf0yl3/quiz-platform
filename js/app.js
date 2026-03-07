import { questions as allQuestions } from './data.js';
import { state, resetState, awardPoint } from './state.js';
import { startTimer, stopTimer } from './timer.js';
import {
  showScreen, setPhase,
  renderScoreboard, renderQuestion, revealAnswer,
  updateTimerDisplay, renderResults
} from './ui.js';
import {
  unlockAudio, playGameStart, playTimerTick, playTimeUp,
  playPointAwarded, startBackgroundMusic, stopBackgroundMusic,
  toggleMute
} from './audio.js';

const TIMER_SECONDS = 60;

// ── Screen 1: Welcome (player pool) ──────────────────────────────────────────

let poolPlayers = [];

function initWelcome() {
  const input  = document.getElementById('pool-member-input');
  const addBtn = document.getElementById('pool-add-btn');
  const nextBtn = document.getElementById('btn-next');

  const addPlayer = () => {
    const name = input.value.trim();
    if (!name) return;
    poolPlayers.push(name);
    renderPoolChips();
    input.value = '';
    input.focus();
    nextBtn.disabled = poolPlayers.length < 2;
  };

  addBtn.addEventListener('click', addPlayer);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });

  nextBtn.addEventListener('click', () => {
    splitTeams();
    showScreen('teams');
  });
}

function renderPoolChips() {
  const container = document.getElementById('pool-members');
  container.innerHTML = '';
  poolPlayers.forEach((name, idx) => {
    const chip = document.createElement('span');
    chip.className = 'member-chip';
    chip.innerHTML = `${name}<button class="chip-remove" aria-label="Remove ${name}">×</button>`;
    chip.querySelector('.chip-remove').addEventListener('click', () => {
      poolPlayers.splice(idx, 1);
      renderPoolChips();
      document.getElementById('btn-next').disabled = poolPlayers.length < 2;
    });
    container.appendChild(chip);
  });
}

// ── Screen 2: Teams (split & name) ───────────────────────────────────────────

function splitTeams() {
  const shuffled = [...poolPlayers];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const mid = Math.ceil(shuffled.length / 2);
  state.teams[0].members = shuffled.slice(0, mid);
  state.teams[1].members = shuffled.slice(mid);
  renderSplitCards();
}

function renderSplitCards() {
  [0, 1].forEach(i => {
    const container = document.getElementById(`split-team${i + 1}-members`);
    container.innerHTML = '';
    state.teams[i].members.forEach(name => {
      const row = document.createElement('div');
      row.className = 'split-member-row';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      row.innerHTML = `<span class="split-member-avatar">${initials}</span>${name}`;
      container.appendChild(row);
    });
  });
}

function initTeams() {
  const startBtn = document.getElementById('btn-start-game');

  const validateTeams = () => {
    startBtn.disabled =
      !state.teams[0].name.trim() ||
      !state.teams[1].name.trim();
  };

  [0, 1].forEach(i => {
    const input = document.getElementById(`team${i + 1}-name`);
    input.addEventListener('input', () => {
      state.teams[i].name = input.value.trim();
      validateTeams();
    });
  });

  document.getElementById('btn-reshuffle').addEventListener('click', () => {
    splitTeams();
  });

  startBtn.addEventListener('click', startGame);
  validateTeams();
}

// ── Screen 3: Game ────────────────────────────────────────────────────────────

function startGame() {
  unlockAudio();
  state.questions = [...allQuestions].sort(() => Math.random() - 0.5);
  state.currentIndex = 0;
  state.history = state.questions.map(q => ({ questionId: q.id, scoredBy: undefined }));

  playGameStart();
  startBackgroundMusic();
  showScreen('game');
  renderScoreboard();
  loadQuestion(0);
}

function loadQuestion(index) {
  stopTimer();
  renderQuestion(index);
  renderScoreboard();
  setPhase('idle');
  updateTimerDisplay(TIMER_SECONDS, TIMER_SECONDS);
}

function handleStartTimer() {
  setPhase('running');
  startTimer(
    TIMER_SECONDS,
    (remaining, total) => {
      updateTimerDisplay(remaining, total);
      if (remaining <= 10 && remaining > 0) playTimerTick();
    },
    () => {
      playTimeUp();
      handleReveal();
    }
  );
}

function handleReveal() {
  stopTimer();
  revealAnswer();
  setPhase('revealed');
}

function handleAward(teamIndex) {
  awardPoint(teamIndex);
  renderScoreboard();
  if (teamIndex !== null) playPointAwarded();

  setTimeout(() => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.questions.length) {
      stopBackgroundMusic();
      showScreen('results');
      renderResults();
    } else {
      state.currentIndex = nextIndex;
      loadQuestion(state.currentIndex);
    }
  }, 1200);
}

// ── Screen 4: Results ─────────────────────────────────────────────────────────

function handleNewGame() {
  resetState();
  poolPlayers = [];
  document.getElementById('pool-members').innerHTML = '';
  document.getElementById('pool-member-input').value = '';
  document.getElementById('btn-next').disabled = true;
  [1, 2].forEach(n => {
    document.getElementById(`team${n}-name`).value = '';
  });
  document.getElementById('btn-start-game').disabled = true;
  showScreen('welcome');
}

// ── Wiring ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initWelcome();
  initTeams();

  document.getElementById('btn-start-timer').addEventListener('click', handleStartTimer);
  document.getElementById('btn-reveal').addEventListener('click', handleReveal);
  document.getElementById('award-btn-0').addEventListener('click', () => handleAward(0));
  document.getElementById('award-btn-1').addEventListener('click', () => handleAward(1));
  document.getElementById('award-btn-both').addEventListener('click', () => handleAward('both'));
  document.getElementById('award-btn-none').addEventListener('click', () => handleAward(null));
  document.getElementById('btn-new-game').addEventListener('click', handleNewGame);

  // Mute toggle
  const muteBtn = document.getElementById('btn-mute');
  muteBtn.addEventListener('click', () => {
    unlockAudio();
    const muted = toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  });

  document.addEventListener('click', unlockAudio, { once: true });
  showScreen('welcome');
});
