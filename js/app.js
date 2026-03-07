import { questions as allQuestions } from './data.js';
import { state, resetState, awardPoint } from './state.js';
import { startTimer, stopTimer } from './timer.js';
import {
  showScreen, setPhase,
  renderScoreboard, renderQuestion, revealAnswer,
  updateTimerDisplay, renderResults
} from './ui.js';

const TIMER_SECONDS = 60;

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
    (remaining, total) => updateTimerDisplay(remaining, total),
    () => handleReveal()
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

  // Brief pause, then advance
  setTimeout(() => {
    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.questions.length) {
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

  showScreen('setup');
});
