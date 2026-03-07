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
  toggleMute, isMuted
} from './audio.js';

const TIMER_SECONDS = 60;

// ── Player pool ───────────────────────────────────────────────────────────────

let poolPlayers = [];

function initPool() {
  const input = document.getElementById('pool-member-input');
  const addBtn = document.getElementById('pool-add-member');
  const splitBtn = document.getElementById('btn-split');

  const addToPool = () => {
    const name = input.value.trim();
    if (!name) return;
    poolPlayers.push(name);
    renderPool();
    input.value = '';
    input.focus();
    splitBtn.disabled = poolPlayers.length < 2;
  };

  addBtn.addEventListener('click', addToPool);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addToPool(); });

  splitBtn.addEventListener('click', () => {
    // Fisher-Yates shuffle
    const shuffled = [...poolPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const mid = Math.ceil(shuffled.length / 2);
    state.teams[0].members = shuffled.slice(0, mid);
    state.teams[1].members = shuffled.slice(mid);

    [0, 1].forEach(i => {
      renderMemberList(i, document.getElementById(`team${i + 1}-members`));
    });
    validateSetup();
  });
}

function renderPool() {
  const container = document.getElementById('pool-members');
  container.innerHTML = '';
  poolPlayers.forEach((name, idx) => {
    const chip = document.createElement('span');
    chip.className = 'member-chip';
    chip.innerHTML = `${name}<button class="chip-remove" aria-label="Remove ${name}">×</button>`;
    chip.querySelector('.chip-remove').addEventListener('click', () => {
      poolPlayers.splice(idx, 1);
      renderPool();
      document.getElementById('btn-split').disabled = poolPlayers.length < 2;
    });
    container.appendChild(chip);
  });
}

function resetPool() {
  poolPlayers = [];
  renderPool();
  document.getElementById('pool-member-input').value = '';
  document.getElementById('btn-split').disabled = true;
}

// ── Setup screen ─────────────────────────────────────────────────────────────

function initSetup() {
  [0, 1].forEach(i => {
    const teamInput = document.getElementById(`team${i + 1}-name`);
    const memberInput = document.getElementById(`team${i + 1}-member-input`);
    const addBtn = document.getElementById(`team${i + 1}-add-member`);
    const memberList = document.getElementById(`team${i + 1}-members`);

    teamInput.addEventListener('input', () => {
      state.teams[i].name = teamInput.value.trim();
      validateSetup();
    });

    const addMember = () => {
      const name = memberInput.value.trim();
      if (!name) return;
      state.teams[i].members.push(name);
      renderMemberList(i, memberList);
      memberInput.value = '';
      memberInput.focus();
      validateSetup();
    };

    addBtn.addEventListener('click', addMember);
    memberInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addMember();
    });
  });

  initPool();
  document.getElementById('btn-start-game').addEventListener('click', startGame);
  validateSetup();
}

function renderMemberList(teamIndex, container) {
  container.innerHTML = '';
  state.teams[teamIndex].members.forEach((name, idx) => {
    const chip = document.createElement('span');
    chip.className = 'member-chip';
    chip.innerHTML = `${name}<button class="chip-remove" aria-label="Remove ${name}">×</button>`;
    chip.querySelector('.chip-remove').addEventListener('click', () => {
      state.teams[teamIndex].members.splice(idx, 1);
      renderMemberList(teamIndex, container);
      validateSetup();
    });
    container.appendChild(chip);
  });
}

function validateSetup() {
  const btn = document.getElementById('btn-start-game');
  const valid =
    state.teams[0].name.length > 0 &&
    state.teams[1].name.length > 0 &&
    state.teams[0].members.length > 0 &&
    state.teams[1].members.length > 0;
  btn.disabled = !valid;
}

// ── Game flow ─────────────────────────────────────────────────────────────────

function startGame() {
  // Shuffle questions
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

  // Brief pause, then advance
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

// ── Results ───────────────────────────────────────────────────────────────────

function handlePlayAgain() {
  resetState();

  // Reset setup form
  [1, 2].forEach(n => {
    document.getElementById(`team${n}-name`).value = '';
    document.getElementById(`team${n}-members`).innerHTML = '';
    document.getElementById(`team${n}-member-input`).value = '';
  });
  resetPool();

  validateSetup();
  showScreen('setup');
}

// ── Wiring ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initSetup();

  document.getElementById('btn-start-timer').addEventListener('click', handleStartTimer);
  document.getElementById('btn-reveal').addEventListener('click', handleReveal);
  document.getElementById('award-btn-0').addEventListener('click', () => handleAward(0));
  document.getElementById('award-btn-1').addEventListener('click', () => handleAward(1));
  document.getElementById('award-btn-none').addEventListener('click', () => handleAward(null));
  document.getElementById('btn-play-again').addEventListener('click', handlePlayAgain);

  // Mute toggle
  const muteBtn = document.getElementById('btn-mute');
  muteBtn.addEventListener('click', () => {
    unlockAudio();
    const muted = toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  });

  // Unlock AudioContext on first interaction (iOS / Chrome policy)
  document.addEventListener('click', unlockAudio, { once: true });

  showScreen('setup');
});
