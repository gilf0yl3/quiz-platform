const defaultTeam = () => ({ name: "", members: [], score: 0 });

export const state = {
  teams: [defaultTeam(), defaultTeam()],
  questions: [],
  currentIndex: 0,
  gamePhase: "idle",   // "idle" | "running" | "revealed"
  history: []          // { questionId, scoredBy: null | 0 | 1 }[]
};

export function resetState() {
  state.teams = [defaultTeam(), defaultTeam()];
  state.questions = [];
  state.currentIndex = 0;
  state.gamePhase = "idle";
  state.history = [];
}

export function awardPoint(teamIndex) {
  if (teamIndex === 'both') {
    state.teams[0].score += 1;
    state.teams[1].score += 1;
  } else if (teamIndex !== null) {
    state.teams[teamIndex].score += 1;
  }
  state.history[state.currentIndex].scoredBy = teamIndex;
}
