import { state } from './state.js';

// ── Screen management ───────────────────────────────────────────────────────

export function showScreen(name) {
  document.documentElement.dataset.screen = name;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Game phase management ───────────────────────────────────────────────────

export function setPhase(phase) {
  state.gamePhase = phase;
  document.getElementById('screen-game').dataset.phase = phase;
}

// ── Scoreboard ──────────────────────────────────────────────────────────────

export function renderScoreboard() {
  const [t1, t2] = state.teams;
  document.getElementById('sb-team1-name').textContent = t1.name || 'Team 1';
  document.getElementById('sb-team2-name').textContent = t2.name || 'Team 2';
  document.getElementById('sb-team1-score').textContent = t1.score;
  document.getElementById('sb-team2-score').textContent = t2.score;
  document.getElementById('award-btn-0').textContent = `▲ ${t1.name || 'Team 1'}`;
  document.getElementById('award-btn-1').textContent = `▲ ${t2.name || 'Team 2'}`;
}

// ── Question rendering ──────────────────────────────────────────────────────

let _pendingAnswer = '';
let _pendingHint = '';

export function renderQuestion(index) {
  const q = state.questions[index];
  _pendingAnswer = q.answer;
  _pendingHint = q.hint || '';

  document.getElementById('question-counter').textContent =
    `Question ${index + 1} of ${state.questions.length}`;
  document.getElementById('category-label').textContent = q.category;
  document.getElementById('question-text').textContent = q.question;

  // Instantly clear + re-blur with no transition so the old answer never flashes
  // and the empty element reveals nothing about the answer length
  const answerEl = document.getElementById('answer-text');
  answerEl.style.transition = 'none';
  answerEl.classList.remove('revealed');
  answerEl.textContent = '';
  void answerEl.offsetWidth; // flush style
  answerEl.style.transition = '';

  document.getElementById('hint-text').textContent = '';
  document.getElementById('hint-text').classList.remove('visible');

  // Slide-in animation on each new question
  const card = document.querySelector('.question-card');
  card.classList.remove('q-enter');
  void card.offsetWidth; // force reflow so animation retriggers
  card.classList.add('q-enter');
}

// ── Answer reveal ───────────────────────────────────────────────────────────

export function revealAnswer() {
  const answerEl = document.getElementById('answer-text');
  answerEl.textContent = _pendingAnswer;
  answerEl.classList.add('revealed');
  const hintEl = document.getElementById('hint-text');
  hintEl.textContent = _pendingHint;
  hintEl.classList.add('visible');
}

// ── Timer UI ─────────────────────────────────────────────────────────────────

export function updateTimerDisplay(remaining, total) {
  const pct = Math.max(0, (remaining / total) * 100);
  const bar = document.getElementById('timer-bar');
  const label = document.getElementById('timer-label');

  bar.style.width = pct + '%';
  label.textContent = remaining + 's';

  bar.classList.remove('warn', 'danger');
  if (remaining <= 10) bar.classList.add('danger');
  else if (remaining <= 20) bar.classList.add('warn');
}

// ── Results screen ──────────────────────────────────────────────────────────

export function renderResults() {
  const [t1, t2] = state.teams;

  let bannerText;
  if (t1.score > t2.score) bannerText = `🏆 ${t1.name} wins!`;
  else if (t2.score > t1.score) bannerText = `🏆 ${t2.name} wins!`;
  else bannerText = "It's a draw!";

  document.getElementById('result-banner').textContent = bannerText;
  document.getElementById('result-score').textContent = `${t1.score} – ${t2.score}`;

  [0, 1].forEach(i => {
    const team = state.teams[i];
    document.getElementById(`result-team${i + 1}-name`).textContent = team.name;
    document.getElementById(`result-team${i + 1}-score`).textContent = team.score;
    document.getElementById(`result-team${i + 1}-members`).textContent =
      team.members.join(', ');
  });

  // Build per-question breakdown
  const breakdown = document.getElementById('breakdown-list');
  breakdown.innerHTML = '';
  state.history.forEach((h, idx) => {
    const q = state.questions[idx];
    const scoredLabel =
      h.scoredBy === null ? 'No point awarded' :
      h.scoredBy === undefined ? 'No point awarded' :
      h.scoredBy === 'both' ? `Point → ${state.teams[0].name} & ${state.teams[1].name}` :
      `Point → ${state.teams[h.scoredBy].name}`;

    const li = document.createElement('li');
    li.className = 'breakdown-item';
    li.innerHTML = `
      <span class="breakdown-q">${q.question}</span>
      <span class="breakdown-a">${q.answer}</span>
      <span class="breakdown-scored">${scoredLabel}</span>
    `;
    breakdown.appendChild(li);
  });
}
